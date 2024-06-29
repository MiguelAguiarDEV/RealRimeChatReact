import React from "react";
import ReactDOM from "react-dom/client";
import "../../css/app.css"; // Importa estilos CSS (supuestamente)

import ChatBox from "./ChatBox.jsx"; // Importa el componente ChatBox

if (document.getElementById("main")) {
    const rootUrl = "http://127.0.0.1:8000"; // Define la URL base del servidor

    // Renderiza el componente ChatBox dentro del elemento con id "main"
    ReactDOM.createRoot(document.getElementById("main")).render(
        <React.StrictMode>
            <ChatBox rootUrl={rootUrl} />
        </React.StrictMode>
    );
}
