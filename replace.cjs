const fs = require('fs');
const path = 'd:/MyProject/KaidNews/OlympicOEOBakand/app/Http/Controllers/Api/TrainingSessionController.php';

let content = fs.readFileSync(path, 'utf8');

const search = `        $data = $sessions->map(function ($session) {
            return [
                'id' => $session->id,
                'team_id' => (string)$session->team_id,
                'team_name' => $session->teamId ? $session->teamId->name : 'ط؛ظٹط± ظ…ط­ط¯ط¯',
                'date' => $session->session_date,
                'location' => $session->location,
                'start' => $session->start_time,
                'end' => $session->end_time,
                'status' => $session->status,
            ];
        });`;

const replace = `        $data = $sessions->map(function ($session) {
            $totalPlayers = \\App\\Models\\Individual::where('team_id', $session->team_id)->where('type', 'لاعب')->count();
            $absentPlayers = \\App\\Models\\AppAbsence::where('training_session_id', $session->id)->whereIn('absence_type', ['غياب', 'غائب مبرر'])->count();
            $presentPlayers = max(0, $totalPlayers - $absentPlayers);

            return [
                'id' => $session->id,
                'team_id' => (string)$session->team_id,
                'team_name' => $session->teamId ? $session->teamId->name : 'ط؛ظٹط± ظ…ط­ط¯ط¯',
                'date' => $session->session_date,
                'location' => $session->location,
                'start' => $session->start_time,
                'end' => $session->end_time,
                'status' => $session->status,
                'attendance_stats' => [
                    'total' => $totalPlayers,
                    'present' => $presentPlayers,
                    'absent' => $absentPlayers
                ]
            ];
        });`;

content = content.replace(search, replace);
fs.writeFileSync(path, content, 'utf8');
console.log('Done replacement');
