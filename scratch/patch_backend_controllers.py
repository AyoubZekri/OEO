import os

backend_path = r"d:\MyProject\KaidNews\OlympicOEOBakand"

meeting_controller = os.path.join(backend_path, r"app\Http\Controllers\Api\MeetingController.php")
decision_controller = os.path.join(backend_path, r"app\Http\Controllers\Api\DecisionController.php")
api_routes = os.path.join(backend_path, r"routes\api.php")

meeting_content = r"""<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use Illuminate\Http\Request;

class MeetingController extends Controller
{
    public function index()
    {
        return response()->json(Meeting::orderBy('date', 'desc')->orderBy('time', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'topic' => 'required|string',
            'date' => 'required|date',
            'time' => 'required',
            'room' => 'required|string',
            'attendees' => 'nullable|array',
            'points' => 'nullable|array',
        ]);

        $meeting = Meeting::create($validated);
        return response()->json($meeting, 201);
    }

    public function show(Meeting $meeting)
    {
        return response()->json($meeting);
    }

    public function update(Request $request, Meeting $meeting)
    {
        $validated = $request->validate([
            'topic' => 'sometimes|string',
            'date' => 'sometimes|date',
            'time' => 'sometimes',
            'room' => 'sometimes|string',
            'attendees' => 'nullable|array',
            'points' => 'nullable|array',
        ]);

        $meeting->update($validated);
        return response()->json($meeting);
    }

    public function destroy(Meeting $meeting)
    {
        $meeting->delete();
        return response()->json(null, 204);
    }
}
"""

decision_content = r"""<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Decision;
use Illuminate\Http\Request;

class DecisionController extends Controller
{
    public function index()
    {
        return response()->json(Decision::orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'meeting_id' => 'nullable|exists:meetings,id',
            'category' => 'nullable|string',
            'type' => 'nullable|string',
            'checklist_items' => 'nullable|array',
            'text' => 'required|string',
            'assignee_ids' => 'nullable|array',
            'deadline' => 'nullable|date',
            'progress' => 'integer|min:0|max:100',
        ]);

        $decision = Decision::create($validated);
        return response()->json($decision, 201);
    }

    public function show(Decision $decision)
    {
        return response()->json($decision);
    }

    public function update(Request $request, Decision $decision)
    {
        $validated = $request->validate([
            'meeting_id' => 'nullable|exists:meetings,id',
            'category' => 'nullable|string',
            'type' => 'nullable|string',
            'checklist_items' => 'nullable|array',
            'text' => 'sometimes|string',
            'assignee_ids' => 'nullable|array',
            'deadline' => 'nullable|date',
            'progress' => 'integer|min:0|max:100',
        ]);

        $decision->update($validated);
        return response()->json($decision);
    }

    public function destroy(Decision $decision)
    {
        $decision->delete();
        return response()->json(null, 204);
    }
}
"""

with open(meeting_controller, "w", encoding="utf-8", newline="\n") as f:
    f.write(meeting_content)

with open(decision_controller, "w", encoding="utf-8", newline="\n") as f:
    f.write(decision_content)

# Patch routes/api.php
with open(api_routes, "r", encoding="utf-8") as f:
    routes_content = f.read()

# Make sure not to duplicate
if "MeetingController" not in routes_content:
    routes_content += "\nuse App\\Http\\Controllers\\Api\\MeetingController;\n"
    routes_content += "use App\\Http\\Controllers\\Api\\DecisionController;\n"
    routes_content += "Route::apiResource('meetings', MeetingController::class);\n"
    routes_content += "Route::apiResource('decisions', DecisionController::class);\n"
    
    with open(api_routes, "w", encoding="utf-8", newline="\n") as f:
        f.write(routes_content)

print("Controllers and routes patched successfully.")
