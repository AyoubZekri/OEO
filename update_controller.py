import re

file_path = r'd:\MyProject\KaidNews\OlympicOEOBakand\app\Http\Controllers\Api\DisciplinaryController.php'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# First, let's remove any previous bad injects from cases if they exist
content = re.sub(r"\'is_acknowledged\' => \(bool\) \$case->is_acknowledged,\s*\'acknowledged_at\' => \$case->acknowledged_at,", "", content)
content = re.sub(r"\'is_acknowledged\' => \$request->has\(\'is_acknowledged\'\) \? \$request->is_acknowledged : \$case->is_acknowledged,\s*\'acknowledged_at\' => \$request->has\(\'acknowledged_at\'\) \? \$request->acknowledged_at : \$case->acknowledged_at,", "", content)
content = re.sub(r"\'is_acknowledged\' => \$action \? \(bool\) \$action->is_acknowledged : false,\s*\'acknowledged_at\' => \$action \? \$action->acknowledged_at : null,", "", content)
content = re.sub(r"\'is_acknowledged\' => \$request->has\(\'is_acknowledged\'\) \? \$request->is_acknowledged : \(\$action \? \$action->is_acknowledged : false\),\s*\'acknowledged_at\' => \$request->has\(\'acknowledged_at\'\) \? \$request->acknowledged_at : \(\$action \? \$action->acknowledged_at : null\),", "", content)
content = re.sub(r"\'is_acknowledged\' => \$request->has\(\'is_acknowledged\'\) \? \$request->is_acknowledged : false,\s*\'acknowledged_at\' => \$request->has\(\'acknowledged_at\'\) \? \$request->acknowledged_at : null,", "", content)

# Now inject proper lines
content = content.replace(
    "'status' => $case->case_status ?? 'مفتوح',",
    "'status' => $case->case_status ?? 'مفتوح',\n                'is_acknowledged' => $action ? (bool) $action->is_acknowledged : false,\n                'acknowledged_at' => $action ? $action->acknowledged_at : null,"
)

# For updates (action exists)
content = content.replace(
    "'effective_date' => $validated['effective_date'] ?? null,\n                ]);\n            } else {",
    "'effective_date' => $validated['effective_date'] ?? null,\n                    'is_acknowledged' => $request->has('is_acknowledged') ? $request->is_acknowledged : ($action ? $action->is_acknowledged : false),\n                    'acknowledged_at' => $request->has('acknowledged_at') ? $request->acknowledged_at : ($action ? $action->acknowledged_at : null),\n                ]);\n            } else {"
)

# For creation (no action exists)
content = content.replace(
    "'effective_date' => $validated['effective_date'] ?? null,\n                    'added_by' => auth()->id() ?? 1,\n                ]);\n            }\n\n            DB::commit();",
    "'effective_date' => $validated['effective_date'] ?? null,\n                    'is_acknowledged' => $request->has('is_acknowledged') ? $request->is_acknowledged : false,\n                    'acknowledged_at' => $request->has('acknowledged_at') ? $request->acknowledged_at : null,\n                    'added_by' => auth()->id() ?? 1,\n                ]);\n            }\n\n            DB::commit();"
)

# For initial store
content = content.replace(
    "'effective_date' => $validated['effective_date'] ?? null,\n                'added_by' => auth()->id() ?? 1,\n            ]);\n\n            DB::commit();",
    "'effective_date' => $validated['effective_date'] ?? null,\n                'is_acknowledged' => $request->has('is_acknowledged') ? $request->is_acknowledged : false,\n                'acknowledged_at' => $request->has('acknowledged_at') ? $request->acknowledged_at : null,\n                'added_by' => auth()->id() ?? 1,\n            ]);\n\n            DB::commit();"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully!")
