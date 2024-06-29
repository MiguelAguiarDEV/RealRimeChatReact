import React from "react";

const Message = ({ userId, message }) => {
    return (
        <div
            className={`row ${
                userId === message.user_id ? "justify-content-end" : ""
            }`}
        >
            <div className="col-md-6">
                {/* Nombre del usuario y hora */}
                <small className="text-muted">
                    <strong>{message.user.name} | </strong>
                </small>
                <small className="text-muted float-right">{message.time}</small>

                {/* Contenedor del mensaje */}
                <div
                    className={`alert alert-${
                        userId === message.user_id ? "primary" : "secondary"
                    }`}
                    role="alert"
                >
                    {message.text} {/* Texto del mensaje */}
                </div>
            </div>
        </div>
    );
};

export default Message;
