import sys

file_path = r"D:\MyProject\KaidNews\OlympicOEOBakand\app\Http\Controllers\Api\FundTransactionController.php"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """        // Check for sufficient balance for withdrawal and transfer
        if (($request->type === 'سحب' || $request->type === 'تحويل') && $request->amount > $fund->current_balance) {
            return response()->json(['error' => 'الرصيد غير كافٍ لإتمام العملية.'], 400);
        }"""

if target in content:
    content = content.replace(target, "")
    with open(file_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Target not found. Target:")
    print(target)
