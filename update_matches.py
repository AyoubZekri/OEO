import os
import re

file_path = 'src/View/Screen/Matches/Matches.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
content = content.replace(
    "import { ViewMatchCallupsDialog } from './ViewMatchCallupsDialog';",
    "import { ViewMatchCallupsDialog } from './ViewMatchCallupsDialog';\nimport { AdministrativeReportDialog } from './AdministrativeReportDialog';"
)
content = content.replace(
    "import { Plus, Edit2, Trash2, Calendar, MapPin, Clock, User, Shield, Users, List } from 'lucide-react';",
    "import { Plus, Edit2, Trash2, Calendar, MapPin, Clock, User, Shield, Users, List, FileText } from 'lucide-react';"
)

# Add hooks
content = content.replace(
    "selectedMatchForViewCallups,\n    openViewCallupsDialog",
    "selectedMatchForViewCallups,\n    openViewCallupsDialog,\n    isAdministrativeReportDialogOpen,\n    selectedMatchForAdministrativeReport,\n    openAdministrativeReportDialog,\n    closeAdministrativeReportDialog"
)

# Add button
old_buttons = '''            <div className="mc-bottom-actions">
              <button className="mc-btn mc-btn-primary" onClick={() => openCallupsDialog(match)}>
                <Users size={18} /> استدعاء اللاعبين
              </button>
              <button className="mc-btn mc-btn-secondary" onClick={() => openViewCallupsDialog(match)}>
                <List size={18} /> القائمة والتشكيلة
              </button>
            </div>'''
new_buttons = '''            <div className="mc-bottom-actions">
              <button className="mc-btn mc-btn-primary" onClick={() => openCallupsDialog(match)}>
                <Users size={18} /> استدعاء اللاعبين
              </button>
              <button className="mc-btn mc-btn-secondary" onClick={() => openViewCallupsDialog(match)}>
                <List size={18} /> التشكيلة
              </button>
              <button className="mc-btn mc-btn-secondary" onClick={() => openAdministrativeReportDialog(match)} style={{ color: '#0ea5e9', borderColor: 'rgba(14, 165, 233, 0.3)' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(14, 165, 233, 0.1)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <FileText size={18} /> التقرير الإداري
              </button>
            </div>'''
content = content.replace(old_buttons, new_buttons)

# Add dialog component at the end
old_dialogs = '''      <ViewMatchCallupsDialog
        isOpen={isViewCallupsDialogOpen}
        onClose={closeViewCallupsDialog}
        matchData={selectedMatchForViewCallups}
      />
    </div>'''
new_dialogs = '''      <ViewMatchCallupsDialog
        isOpen={isViewCallupsDialogOpen}
        onClose={closeViewCallupsDialog}
        matchData={selectedMatchForViewCallups}
      />

      <AdministrativeReportDialog
        isOpen={isAdministrativeReportDialogOpen}
        onClose={closeAdministrativeReportDialog}
        matchData={selectedMatchForAdministrativeReport}
      />
    </div>'''
content = content.replace(old_dialogs, new_dialogs)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
