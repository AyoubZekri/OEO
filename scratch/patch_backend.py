import os

def patch_routes():
    routes_file = r"d:\MyProject\KaidNews\OlympicOEOBakand\routes\api.php"
    with open(routes_file, 'r', encoding='utf-8') as f:
        content = f.read()

    route_code = "    Route::post('/equipment-operations/undo-return', [\App\Http\Controllers\Api\EquipmentOperationController::class, 'undoReturnEquipment']);\n"
    if "undo-return" not in content:
        content = content.replace("Route::post('/equipment-operations/return', [\App\Http\Controllers\Api\EquipmentOperationController::class, 'returnEquipment']);", 
                                  "Route::post('/equipment-operations/return', [\App\Http\Controllers\Api\EquipmentOperationController::class, 'returnEquipment']);\n" + route_code)
        
        with open(routes_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched api.php")

def patch_controller():
    controller_file = r"d:\MyProject\KaidNews\OlympicOEOBakand\app\Http\Controllers\Api\EquipmentOperationController.php"
    with open(controller_file, 'r', encoding='utf-8') as f:
        content = f.read()

    method_code = """
    public function undoReturnEquipment(Request $request)
    {
        $validated = $request->validate([
            'movement_id' => 'required|exists:equipment_movements,id',
        ]);

        DB::beginTransaction();
        try {
            $movement = EquipmentMovement::findOrFail($validated['movement_id']);
            
            $movement->update([
                'movement_status' => 'تسليم', // Handover status, since we are undoing a return
                'return_date' => null,
                'return_condition' => null,
            ]);

            $equipment = Equipment::findOrFail($movement->equipment_id);
            $equipment->available_quantity -= $movement->quantity;
            $equipment->save();

            DB::commit();
            return response()->json(['message' => 'تم التراجع عن الإرجاع بنجاح', 'movement' => $movement], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
"""
    if "undoReturnEquipment" not in content:
        content = content.replace("public function update(Request $request)", method_code + "\n    public function update(Request $request)")
        
        with open(controller_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Patched EquipmentOperationController.php")

patch_routes()
patch_controller()
