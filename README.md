# Guía para Construir una Aplicación de Chat en Tiempo Real con Laravel Reverb

## Requisitos Previos

- **PHP**: 8.2+
- **Composer**
- **Node.js**: 20+
- **Base de Datos**: MySQL 5.7+

## Instalación de Laravel

1. Crear un nuevo proyecto Laravel:
    ```sh
    composer create-project laravel/laravel:^11.0 laravel-reverb-react-chat
    cd laravel-reverb-react-chat/
    php artisan serve
    ```
    Este comando crea un nuevo proyecto Laravel llamado `laravel-reverb-react-chat` y luego cambia al directorio del proyecto. Finalmente, se inicia el servidor de desarrollo de Laravel.

## Crear Modelo y Migración para Mensajes

1. Crear el modelo y la migración:
    ```sh
    php artisan make:model -m Message
    ```
    Este comando genera un modelo Eloquent llamado `Message` y una migración correspondiente para la base de datos. El modelo se ubicará en `app/Models/Message.php` y la migración en `database/migrations`.

2. Configurar el modelo de mensaje (`app/Models/Message.php`):
    ```php
    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Factories\HasFactory;
    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\Relations\BelongsTo;

    class Message extends Model
    {
        use HasFactory;

        public $table = 'messages';
        protected $fillable = ['id', 'user_id', 'text'];

        public function user(): BelongsTo {
            return $this->belongsTo(User::class, 'user_id');
        }

        public function getTimeAttribute(): string {
            return date(
                "d M Y, H:i:s",
                strtotime($this->attributes['created_at'])
            );
        }
    }
    ```
    Este es el modelo de `Message`. 
    - `use HasFactory;` permite usar fábricas de modelos para pruebas.
    - `protected $fillable = ['id', 'user_id', 'text'];` define los campos que se pueden asignar masivamente.
    - El método `user()` define una relación de pertenencia con el modelo `User`.
    - El accesor `getTimeAttribute()` convierte la fecha de creación del mensaje a un formato legible.

3. Configurar la migración para la tabla de mensajes (`database/migrations/2024_03_25_000831_create_messages_table.php`):
    ```php
    <?php

    use Illuminate\Database\Migrations\Migration;
    use Illuminate\Database\Schema\Blueprint;
    use Illuminate\Support\Facades\Schema;

    return new class extends Migration
    {
        public function up(): void {
            Schema::create('messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained();
                $table->text('text')->nullable();
                $table->timestamps();
            });
        }

        public function down(): void {
            Schema::dropIfExists('messages');
        }
    };
    ```
    Esta migración crea una tabla `messages` con las siguientes columnas:
    - `id`: clave primaria auto-incremental.
    - `user_id`: clave foránea que referencia a la tabla `users`.
    - `text`: columna de texto para el contenido del mensaje.
    - `timestamps`: columnas `created_at` y `updated_at` para registrar las marcas de tiempo.

4. Configurar las variables de entorno en `.env`:
    ```env
    DB_CONNECTION=mysql
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_DATABASE=database_name
    DB_USERNAME=username
    DB_PASSWORD=password
    ```
    Estas variables de entorno configuran la conexión a la base de datos MySQL. Asegúrate de reemplazar `database_name`, `username` y `password` con tus propios valores.

5. Optimizar caché y ejecutar migraciones:
    ```sh
    php artisan optimize
    php artisan migrate:fresh
    ```
    - `php artisan optimize`: optimiza la caché de configuración, rutas y servicios.
    - `php artisan migrate:fresh`: elimina todas las tablas y vuelve a ejecutar todas las migraciones.

## Configurar Autenticación

1. Instalar el paquete de autenticación UI:
    ```sh
    composer require laravel/ui
    php artisan ui react --auth
    npm install && npm run build
    ```
    - `composer require laravel/ui`: instala el paquete Laravel UI para autenticación.
    - `php artisan ui react --auth`: configura la autenticación utilizando React.
    - `npm install && npm run build`: instala dependencias de Node.js y construye los activos del frontend.

## Definir Rutas

1. Añadir rutas en `routes/web.php`:
    ```php
    <?php

    use Illuminate\Support\Facades\Auth;
    use Illuminate\Support\Facades\Route;
    use App\Http\Controllers\HomeController;

    Route::get('/', function () { return view('welcome'); });

    Auth::routes();

    Route::get('/home', [HomeController::class, 'index'])
        ->name('home');
    Route::get('/messages', [HomeController::class, 'messages'])
        ->name('messages');
    Route::post('/message', [HomeController::class, 'message'])
        ->name('message');
    ```
    - `Route::get('/', function () { return view('welcome'); });`: define la ruta principal que devuelve la vista `welcome`.
    - `Auth::routes();`: define las rutas de autenticación proporcionadas por Laravel.
    - `Route::get('/home', [HomeController::class, 'index'])->name('home');`: define la ruta para la página de inicio.
    - `Route::get('/messages', [HomeController::class, 'messages'])->name('messages');`: define la ruta para obtener todos los mensajes.
    - `Route::post('/message', [HomeController::class, 'message'])->name('message');`: define la ruta para enviar un nuevo mensaje.

## Configurar Eventos y Trabajos en Cola

1. Crear evento `GotMessage`:
    ```sh
    php artisan make:event GotMessage
    ```
    Este comando genera un nuevo evento llamado `GotMessage`. Los eventos de Laravel permiten suscribirse y escuchar varios eventos que ocurren en la aplicación.

2. Configurar evento en `app/Events/GotMessage.php`:
    ```php
    <?php

    namespace App\Events;

    use Illuminate\Broadcasting\InteractsWithSockets;
    use Illuminate\Broadcasting\PrivateChannel;
    use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
    use Illuminate\Foundation\Events\Dispatchable;
    use Illuminate\Queue\SerializesModels;

    class GotMessage implements ShouldBroadcast
    {
        use Dispatchable, InteractsWithSockets, SerializesModels;

        public function __construct(public array $message) {
            //
        }

        public function broadcastOn(): array {
            // $this->message es accesible aquí
            return [
                new PrivateChannel("channel_for_everyone"),
            ];
        }
    }
    ```
    - `ShouldBroadcast`: indica que este evento debería ser transmitido.
    - `broadcastOn()`: define el canal privado al que se transmitirá este evento.
    - `public array $message`: permite pasar la información del mensaje al constructor.

3. Crear trabajo en cola `SendMessage`:
    ```sh
    php artisan make:job SendMessage
    ```

4. Configurar trabajo en cola en `app/Jobs/SendMessage.php`:
    ```php
    <?php

    namespace App\Jobs;

    use App\Events\GotMessage;
    use App\Models\Message;
    use Illuminate\Bus\Queueable;
    use Illuminate\Contracts\Queue\ShouldQueue;
    use Illuminate\Foundation\Bus\Dispatchable;
    use Illuminate\Queue\InteractsWithQueue;
    use Illuminate\Queue\SerializesModels;

    class SendMessage implements ShouldQueue
    {
        use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

        public function __construct(public Message $message) {
            //
        }

        public function handle(): void {
            GotMessage::dispatch([
                'id' => $this->message->id,
                'user_id' => $this->message->user_id,
                'text' => $this->message->text,
                'time' => $this->message->time,
            ]);
        }
    }
    ```
    - `ShouldQueue`: indica que este trabajo debería ser procesado en una cola.
    - `handle()`: el método que se ejecutará cuando el trabajo sea procesado. Despacha el evento `GotMessage` con los detalles del mensaje.

## Escribir Métodos del Controlador

1. Configurar controlador en `app/Http/Controllers/HomeController.php`:
    ```php
    <?php

    namespace App\Http\Controllers;

    use App\Jobs\SendMessage;
    use App\Models\Message;
    use App\Models\User;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\Request;

    class HomeController extends Controller
    {
        public function __construct() {
            $this->middleware('auth');
        }

        public function index() {
            $user = User::where('id', auth()->id())->select([
                'id', 'name', 'email',
            ])->first();

            return view('home', [
                'user' => $user,
            ]);
        }

        public function messages(): JsonResponse {
            $messages = Message::with('user')->get()->append('time');

            return response()->json($messages);
        }

        public function message(Request $request): JsonResponse {
            $message = Message::create([
                'user_id' => auth()->id(),
                'text' => $request->get('text'),
            ]);
            SendMessage::dispatch($message);

            return response()->json([
                'success' => true,
                'message' => "Message created and job dispatched.",
            ]);
        }
    }
    ```
    - `index()`: obtiene los datos del usuario autenticado y los envía a la vista `home`.
    - `messages()`: obtiene todos los mensajes con los datos del usuario relacionado y envía la respuesta en formato JSON.
    - `message()`: crea un nuevo mensaje en la base de datos y despacha el trabajo `SendMessage`.

## Instalar Laravel Reverb

1. Instalar Reverb:
    ```sh
    php artisan install:broadcasting
    ```
    Este comando instala Laravel Reverb y las dependencias de Node.js necesarias para la transmisión en tiempo real. Asegúrate de que las variables de entorno relacionadas con Reverb se añadan automáticamente a tu archivo `.env`.

    ```env
    BROADCAST_CONNECTION=reverb

    ###

    REVERB_APP_ID=795051
    REVERB_APP_KEY=s3w3thzezulgp5g0e5bs
    REVERB_APP_SECRET=gncsnk3rzpvczdakl6pz
    REVERB_HOST="localhost"
    REVERB_PORT=8080
    REVERB_SCHEME=http

    VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
    VITE_REVERB_HOST="${REVERB_HOST}"
    VITE_REVERB_PORT="${REVERB_PORT}"
    VITE_REVERB_SCHEME="${REVERB_SCHEME}"
    ```

## Configurar Canales WebSocket

1. Definir canal en `routes/channels.php`:
    ```php
    <?php

    use Illuminate\Support\Facades\Broadcast;

    Broadcast::channel('channel_for_everyone', function ($user) {
        return true;
    });
    ```
    Este archivo define los canales de transmisión. En este caso, se crea un canal privado `channel_for_everyone` al que cualquier usuario autenticado puede suscribirse.

2. Optimizar caché:
    ```sh
    php artisan optimize
    ```

## Personalizar Vistas en Laravel

1. Modificar vista en `resources/views/home.blade.php`:
    ```php
    @extends('layouts.app')

    @section('content')
        <div class="container">
            <div id="main" data-user="{{ json_encode($user) }}"></div>
        </div>
    @endsection
    ```
    Este código asegura que haya un div con el ID `main` donde se renderizarán los componentes de React. El atributo `data-user` contiene la información del usuario en formato JSON.

2. Modificar `resources/views/welcome.blade.php`:
    - Reemplaza `url('/dashboard')` con `url('/home')`.
    - Reemplaza `Dashboard` con `Home`.
    - Elimina las secciones `main` y `footer`.

## Trabajar en el Frontend con React

1. Crear componente `Main.jsx` en `resources/js/components/`:
    ```jsx
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import '../../css/app.css';
    import ChatBox from "./ChatBox.jsx";

    if (document.getElementById('main')) {
        const rootUrl = "http://127.0.0.1:8000";
        
        ReactDOM.createRoot(document.getElementById('main')).render(
            <React.StrictMode>
                <ChatBox rootUrl={rootUrl} />
            </React.StrictMode>
        );
    }
    ```
    Este componente se encarga de renderizar el componente `ChatBox` dentro del div con el ID `main`. Define la URL base `rootUrl` que se utilizará para las solicitudes de API.

2. Crear componente `Message.jsx`:
    ```jsx
    import React from "react";

    const Message = ({ userId, message }) => {
        return (
            <div className={`row ${
            userId === message.user_id ? "justify-content-end" : ""
            }`}>
                <div className="col-md-6">
                    <small className="text-muted">
                        <strong>{message.user.name} | </strong>
                    </small>
                    <small className="text-muted float-right">
                        {message.time}
                    </small>
                    <div className={`alert alert-${
                    userId === message.user_id ? "primary" : "secondary"
                    }`} role="alert">
                        {message.text}
                    </div>
                </div>
            </div>
        );
    };

    export default Message;
    ```
    Este componente muestra cada mensaje en la interfaz del chat. Se alinea a la derecha si el mensaje es del usuario autenticado y a la izquierda si es de otro usuario. Muestra el nombre del usuario, la hora y el texto del mensaje.

3. Crear componente `MessageInput.jsx`:
    ```jsx
    import React, { useState } from "react";

    const MessageInput = ({ rootUrl }) => {
        const [message, setMessage] = useState("");

        const messageRequest = async (text) => {
            try {
                await axios.post(`${rootUrl}/message`, {
                    text,
                });
            } catch (err) {
                console.log(err.message);
            }
        };

        const sendMessage = (e) => {
            e.preventDefault();
            if (message.trim() === "") {
                alert("Please enter a message!");
                return;
            }

            messageRequest(message);
            setMessage("");
        };

        return (
            <div className="input-group">
                <input onChange={(e) => setMessage(e.target.value)}
                       autoComplete="off"
                       type="text"
                       className="form-control"
                       placeholder="Message..."
                       value={message}
                />
                <div className="input-group-append">
                    <button onClick={(e) => sendMessage(e)}
                            className="btn btn-primary"
                            type="button">Send</button>
                </div>
            </div>
        );
    };

    export default MessageInput;
    ```
    Este componente proporciona un campo de entrada para que los usuarios escriban mensajes y los envíen en la interfaz del chat. Cuando se hace clic en el botón, se envía el mensaje al servidor mediante una solicitud POST de Axios.

4. Crear componente `ChatBox.jsx`:
    ```jsx
    import React, { useEffect, useRef, useState } from "react";
    import Message from "./Message.jsx";
    import MessageInput from "./MessageInput.jsx";

    const ChatBox = ({ rootUrl }) => {
        const userData = document.getElementById('main')
            .getAttribute('data-user');

        const user = JSON.parse(userData);
        // `App.Models.User.${user.id}`;
        const webSocketChannel = `channel_for_everyone`;

        const [messages, setMessages] = useState([]);
        const scroll = useRef();

        const scrollToBottom = () => {
            scroll.current.scrollIntoView({ behavior: "smooth" });
        };

        const connectWebSocket = () => {
            window.Echo.private(webSocketChannel)
                .listen('GotMessage', async (e) => {
                    // e.message
                    await getMessages();
                });
        }

        const getMessages = async () => {
            try {
                const m = await axios.get(`${rootUrl}/messages`);
                setMessages(m.data);
                setTimeout(scrollToBottom, 0);
            } catch (err) {
                console.log(err.message);
            }
        };

        useEffect(() => {
            getMessages();
            connectWebSocket();

            return () => {
                window.Echo.leave(webSocketChannel);
            }
        }, []);

        return (
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header">Chat Box</div>
                        <div className="card-body"
                             style={{height: "500px", overflowY: "auto"}}>
                            {
                                messages?.map((message) => (
                                    <Message key={message.id}
                                             userId={user.id}
                                             message={message}
                                    />
                                ))
                            }
                            <span ref={scroll}></span>
                        </div>
                        <div className="card-footer">
                            <MessageInput rootUrl={rootUrl} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    export default ChatBox;
    ```
    Este componente gestiona la interfaz de chat dentro de la aplicación. 
    - `getMessages()`: obtiene los mensajes del servidor.
    - `connectWebSocket()`: se conecta al canal de WebSocket para recibir actualizaciones en tiempo real.
    - `useEffect()`: se ejecuta al montar el componente y establece la conexión de WebSocket y obtiene los mensajes.

## Ejecutar la Aplicación

1. Ejecutar los comandos necesarios:
    ```sh
    npm run build
    php artisan queue:listen
    php artisan reverb:start
    php artisan serve
    ```
    - `npm run build`: construye los activos del frontend.
    - `php artisan queue:listen`: escucha los trabajos en cola.
    - `php artisan reverb:start`: inicia el servidor de WebSocket Reverb.
    - `php artisan serve`: inicia el servidor de desarrollo de Laravel.

2. Visitar la URL por defecto: `http://127.0.0.1:8000`.

3. Registrar dos usuarios diferentes, iniciar sesión con ellos, enviar mensajes y ver cómo se actualiza la caja de chat en tiempo real.

## Recursos Útiles de Reverb

- [Documentación oficial de Laravel Broadcasting](https://laravel.com/docs/9.x/broadcasting)
- [Charla de Taylor Otwell en Laracon EU 2024](https://laracon.eu/)
- [Joe Dixon en X (creador de Reverb)](https://twitter.com/joe_dixon)
- [Episodio de Laracast sobre Reverb](https://laracasts.com/)
