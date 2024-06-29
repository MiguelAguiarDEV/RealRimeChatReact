<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;

    // Nombre de la tabla en la base de datos
    public $table = 'messages';

    // Atributos que se pueden asignar de manera masiva (mass assignment)
    protected $fillable = ['id', 'user_id', 'text'];

    // Relación: Un mensaje pertenece a un usuario (belongsTo)
    public function user(): BelongsTo
    {
        // Define la relación con la clase User, utilizando la clave foránea 'user_id'
        return $this->belongsTo(User::class, 'user_id');
    }

    // Accesor: Define un atributo virtual 'time' que devuelve la fecha formateada del mensaje
    public function getTimeAttribute(): string
    {
        return date(
            'd M Y, H:i:s',
            strtotime($this->attributes['created_at'])
        );
    }
}
