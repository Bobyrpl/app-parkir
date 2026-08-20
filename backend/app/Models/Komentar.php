<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Komentar extends Model
{
    use HasFactory;

    protected $fillable = ['nama', 'teks', 'rating', 'balasan', 'dibalas_pada'];

    protected $casts = [
        'dibalas_pada' => 'datetime',
    ];
}