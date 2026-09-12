import os
import re

api_php_path = r'..\OlympicOEOBakand\routes\api.php'
controller_path = r'..\OlympicOEOBakand\app\Http\Controllers\Api\EquipmentOperationController.php'

# Patch api.php
with open(api_php_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'equipment-operations/update' not in content:
    content = content.replace(
        "Route::post('/equipment-operations/return', [\App\Http\Controllers\Api\EquipmentOperationController::class, 'returnEquipment']);",
        "Route::post('/equipment-operations/return', [\App\Http\Controllers\Api\EquipmentOperationController::class, 'returnEquipment']);\n    Route::post('/equipment-operations/update', [\App\Http\Controllers\Api\EquipmentOperationController::class, 'update']);\n    Route::post('/equipment-operations/delete', [\App\Http\Controllers\Api\EquipmentOperationController::class, 'destroy']);"
    )
    with open(api_php_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched api.php")

# Patch controller
with open(controller_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'public function update' not in content:
    methods = '''
    public function update(Request )
    {
         = ->validate([
            'id' => 'required|exists:equipment_operations,id',
            'member_id' => 'required|exists:individuals,id',
            'operation_date' => 'required|date',
            'items' => 'required|array',
            'items.*.equipment_id' => 'required|exists:equipments,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.condition' => 'required|string',
        ]);

        DB::beginTransaction();
        try {
             = EquipmentOperation::findOrFail(['id']);
            ->update([
                'member_id' => ['member_id'],
                'operation_date' => ['operation_date'],
            ]);

            // Restore all old quantities first
            foreach (->movements as ) {
                 = Equipment::find(->equipment_id);
                if () {
                    ->available_quantity += ->quantity;
                    ->save();
                }
            }

            // Delete old movements
            ->movements()->delete();

            // Create new movements
            foreach (['items'] as ) {
                 = Equipment::findOrFail(['equipment_id']);
                
                if (->available_quantity < ['quantity']) {
                    throw new \Exception("ÇáßãíÉ ÇáãØáæÈÉ ãä {->name} ÛíÑ ãÊæÝÑÉ.");
                }

                EquipmentMovement::create([
                    'operation_id' => ->id,
                    'equipment_id' => ->id,
                    'quantity' => ['quantity'],
                    'movement_status' => 'ÊÓáíã',
                    'delivery_date' => ['operation_date'],
                    'delivery_condition' => ['condition'],
                ]);

                ->available_quantity -= ['quantity'];
                ->save();
            }

            DB::commit();
            return response()->json(['message' => 'Operation updated successfully', 'operation' => ->load('movements.equipment')], 200);
        } catch (\Exception ) {
            DB::rollBack();
            return response()->json(['error' => ->getMessage()], 400);
        }
    }

    public function destroy(Request )
    {
         = ->validate([
            'id' => 'required|exists:equipment_operations,id',
        ]);

        DB::beginTransaction();
        try {
             = EquipmentOperation::findOrFail(['id']);
            
            // Restore quantities
            foreach (->movements as ) {
                 = Equipment::find(->equipment_id);
                if () {
                    ->available_quantity += ->quantity;
                    ->save();
                }
            }
            
            // Delete movements and operation
            ->movements()->delete();
            ->delete();

            DB::commit();
            return response()->json(['message' => 'Operation deleted successfully'], 200);
        } catch (\Exception ) {
            DB::rollBack();
            return response()->json(['error' => ->getMessage()], 400);
        }
    }
}
'''
    content = content.replace("}\n}", "}\n" + methods)
    # Also if the file ends with just } we can replace the last }
    
    # regex to replace the last closing brace
    content = re.sub(r'}\s*$', methods, content)
    
    with open(controller_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched controller")
