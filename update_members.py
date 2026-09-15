import os
import re

file_path = 'src/View/Screen/Members/Members.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace("import { DisciplinaryActionDialog } from './DisciplinaryActionDialog';", "import { DisciplinaryActionDialog } from './DisciplinaryActionDialog';\nimport { ClearanceDialog } from './ClearanceDialog';\nimport { LogOut } from 'lucide-react';")

# Extract properties from controller
content = content.replace("openActionDialog,", "openActionDialog,\n    isClearanceDialogOpen,\n    selectedMemberForClearance,\n    openClearanceDialog,\n    closeClearanceDialog,")

# Add button
clearance_button = '''
                <button 
                  className="mc-icon-btn mc-action" 
                  onClick={() => openClearanceDialog(member)}
                  title="إخلاء طرف"
                  style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'; }}
                >
                  <LogOut size={16} />
                </button>'''

content = content.replace('''<button 
                  className="mc-icon-btn mc-action" 
                  onClick={() => openActionDialog(member)}
                  title="إجراء تأديبي"''', clearance_button + "\n                " + '''<button 
                  className="mc-icon-btn mc-action" 
                  onClick={() => openActionDialog(member)}
                  title="إجراء تأديبي"''')

# Render Dialog
dialog_element = '''
      {isClearanceDialogOpen && (
        <ClearanceDialog
          isOpen={isClearanceDialogOpen}
          onClose={closeClearanceDialog}
          player={selectedMemberForClearance}
        />
      )}
'''

content = content.replace("{isActionDialogOpen && (", dialog_element + "\n      {isActionDialogOpen && (")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
