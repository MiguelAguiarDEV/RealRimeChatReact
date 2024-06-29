<?php

use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

// Ruta principal que devuelve la vista 'welcome'
Route::get('/', function () {
    return view('welcome');
});

// Rutas de autenticación proporcionadas por Laravel
Auth::routes();

// Ruta protegida que muestra el panel principal del usuario (Home)
Route::get('/home', [HomeController::class, 'index'])
    ->name('home');

// Ruta para obtener los mensajes (probablemente para mostrar en la interfaz de usuario)
Route::get('/messages', [HomeController::class, 'messages'])
    ->name('messages');

// Ruta para enviar un nuevo mensaje (probablemente desde un formulario)
Route::post('/message', [HomeController::class, 'message'])
    ->name('message');
