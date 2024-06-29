import React, { useState } from "react";
import axios from "axios"; // Importa axios para realizar peticiones HTTP

const MessageInput = ({ rootUrl }) => {
    const [message, setMessage] = useState(""); // Estado para almacenar el mensaje que se está escribiendo

    // Función asincrónica para enviar el mensaje al servidor
    const messageRequest = async (text) => {
        try {
            await axios.post(`${rootUrl}/message`, { text }); // Realiza una solicitud POST al servidor con el texto del mensaje
        } catch (err) {
            console.log(err.message); // Maneja errores mostrando el mensaje en la consola del navegador
        }
    };

    // Función para enviar el mensaje
    const sendMessage = (e) => {
        e.preventDefault(); // Evita que el formulario se envíe de manera convencional (recarga de página)

        // Verifica que el mensaje no esté vacío
        if (message.trim() === "") {
            alert("Please enter a message!"); // Muestra una alerta si el mensaje está vacío
            return;
        }

        messageRequest(message); // Llama a la función messageRequest para enviar el mensaje al servidor
        setMessage(""); // Limpia el estado del mensaje después de enviarlo
    };

    // Renderizado del componente de entrada de mensaje
    return (
        <div className="input-group">
            {/* Input para escribir el mensaje */}
            <input
                onChange={(e) => setMessage(e.target.value)} // Actualiza el estado del mensaje mientras el usuario escribe
                autoComplete="off"
                type="text"
                className="form-control"
                placeholder="Message..."
                value={message} // Valor del input controlado por el estado 'message'
            />
            {/* Botón para enviar el mensaje */}
            <div className="input-group-append">
                <button
                    onClick={(e) => sendMessage(e)} // Maneja el click para enviar el mensaje
                    className="btn btn-primary"
                    type="button"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default MessageInput;
