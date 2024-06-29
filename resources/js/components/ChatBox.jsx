import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Message from "./Message.jsx";
import MessageInput from "./MessageInput.jsx";

const ChatBox = ({ rootUrl }) => {
    // Obtener datos del usuario actual desde el atributo data-user del elemento con id "main"
    const userData = document.getElementById("main").getAttribute("data-user");
    const user = JSON.parse(userData); // Parsear los datos del usuario

    // Canal de WebSocket al que se suscribe el cliente
    const webSocketChannel = `channel_for_everyone`;

    // Estado para almacenar los mensajes del chat
    const [messages, setMessages] = useState([]);

    // Referencia para el elemento que se utilizará para hacer scroll hacia abajo
    const scroll = useRef();

    // Función para hacer scroll hacia abajo de manera suave
    const scrollToBottom = () => {
        scroll.current.scrollIntoView({ behavior: "smooth" });
    };

    // Función para conectar al WebSocket y escuchar eventos
    const connectWebSocket = () => {
        window.Echo.private(webSocketChannel).listen(
            "GotMessage",
            async (e) => {
                // Cuando se recibe un nuevo mensaje, se actualiza la lista de mensajes
                await getMessages();
            }
        );
    };

    // Función para obtener los mensajes del servidor
    const getMessages = async () => {
        try {
            const response = await axios.get(`${rootUrl}/messages`);
            setMessages(response.data); // Actualizar el estado con los mensajes recibidos
            setTimeout(scrollToBottom, 0); // Hacer scroll hacia abajo cuando se actualiza
        } catch (err) {
            console.log(err.message);
        }
    };

    // Efecto de React para ejecutar acciones al cargar el componente
    useEffect(() => {
        getMessages(); // Obtener mensajes al cargar el componente
        connectWebSocket(); // Conectar al WebSocket

        // Función de limpieza al desmontar el componente
        return () => {
            window.Echo.leave(webSocketChannel); // Desconectar del canal de WebSocket
        };
    }, []); // La dependencia vacía [] indica que el efecto se ejecuta solo una vez al montar el componente

    // Componente ChatBox renderizado con JSX
    return (
        <div className="row justify-content-center">
            <div className="col-md-8">
                <div className="card">
                    <div className="card-header">Chat Box</div>
                    <div
                        className="card-body"
                        style={{ height: "500px", overflowY: "auto" }}
                    >
                        {/* Mapear y renderizar los mensajes */}
                        {messages?.map((message) => (
                            <Message
                                key={message.id}
                                userId={user.id}
                                message={message}
                            />
                        ))}
                        {/* Referencia para hacer scroll hacia abajo */}
                        <span ref={scroll}></span>
                    </div>
                    <div className="card-footer">
                        {/* Componente para enviar mensajes */}
                        <MessageInput rootUrl={rootUrl} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatBox;
