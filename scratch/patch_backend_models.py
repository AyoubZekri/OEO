import os

backend_path = r"d:\MyProject\KaidNews\OlympicOEOBakand"

meeting_model = os.path.join(backend_path, r"app\Models\Meeting.php")
decision_model = os.path.join(backend_path, r"app\Models\Decision.php")

meeting_content = """<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Meeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'topic', 'date', 'time', 'room', 'attendees', 'points'
    ];

    protected $casts = [
        'attendees' => 'array',
        'points' => 'array',
    ];
}
"""

decision_content = """<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Decision extends Model
{
    use HasFactory;

    protected $fillable = [
        'meeting_id', 'category', 'type', 'checklist_items', 'text', 'assignee_ids', 'deadline', 'progress'
    ];

    protected $casts = [
        'checklist_items' => 'array',
        'assignee_ids' => 'array',
    ];

    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }
}
"""

with open(meeting_model, "w", encoding="utf-8", newline="\n") as f:
    f.write(meeting_content)

with open(decision_model, "w", encoding="utf-8", newline="\n") as f:
    f.write(decision_content)

print("Models patched successfully.")
