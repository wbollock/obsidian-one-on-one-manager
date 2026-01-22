# 1:1 Manager - Obsidian Plugin

Track and analyze your 1:1 meetings with automatic theme extraction, action item tracking, meeting history timelines, and a visual analytics dashboard.

## Features

- **📝 Structured Meeting Notes**: Create 1:1 notes with templates including person, date, mood, topics, and action items
- **🎯 Theme Extraction**: Automatically detect recurring themes (career growth, technical challenges, team dynamics, etc.)
- **📊 Analytics Dashboard**: Visual overview with meeting frequency, theme analysis, and action item completion rates
- **📅 Timeline View**: Chronological history of all meetings with a specific person
- **✅ Action Item Tracking**: Parse and track checkboxes, highlight incomplete items
- **🎨 Beautiful Visuals**: Clean, modern interface with charts and color-coded indicators

## Installation & Setup

### Prerequisites

- Obsidian v0.15.0 or higher
- Node.js v16 or higher
- npm

### Local Development Setup

1. **Navigate to the plugin directory:**
   ```bash
   cd one-on-one-manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the plugin:**
   ```bash
   npm run build
   ```
   
   This creates `main.js`, `styles.css`, and `manifest.json` in the root directory.

4. **Copy plugin to your Obsidian vault:**
   
   Copy the entire `one-on-one-manager` folder to your vault's plugins directory:
   
   - **Windows**: `<VaultFolder>\.obsidian\plugins\`
   - **Mac**: `<VaultFolder>/.obsidian/plugins/`
   - **Linux**: `<VaultFolder>/.obsidian/plugins/`
   
   Example:
   ```bash
   cp -r one-on-one-manager ~/Documents/MyVault/.obsidian/plugins/
   ```

5. **Enable the plugin in Obsidian:**
   - Open Obsidian
   - Go to Settings → Community plugins
   - Turn off "Safe mode" (if not already disabled)
   - Click "Reload plugins" (or restart Obsidian)
   - Find "1:1 Manager" in the list
   - Toggle it on

### Development Mode (Hot Reload)

For active development with automatic rebuilds:

```bash
npm run dev
```

This watches for file changes and rebuilds automatically. You'll need to reload the plugin in Obsidian after each build (Ctrl/Cmd+R or use the "Reload app without saving" command).

## Usage

### Creating a 1:1 Meeting Note

1. **Via Command Palette** (Ctrl/Cmd+P):
   - Type "Create 1:1 Meeting Note"
   - Fill in person name, date, mood, and topics
   - Click "Create"

2. **Note Structure:**
   ```markdown
   ---
   person: John Doe
   date: 2026-01-22
   mood: Good
   topics:
     - Project updates
     - Career goals
   ---
   
   # 1:1 with John Doe
   
   ## Discussion Points
   
   ### Project updates
   Discussed the Q1 roadmap and technical debt priorities...
   
   ## Action Items
   
   - [ ] Review architecture proposal @john 📅 2026-01-29
   - [x] Schedule team meeting
   
   ## Notes
   
   John mentioned interest in promotion. Need to discuss career path.
   ```

### Viewing the Dashboard

1. **Via Ribbon Icon**: Click the 👥 icon in the left sidebar
2. **Via Command Palette**: Type "Open Dashboard"

The dashboard shows:
- Total people, meetings, and monthly stats
- Team member cards (click to view timeline)
- Common themes across all meetings
- Outstanding action items

### Viewing Timeline for a Person

- Click any person card in the dashboard
- Or use the Command Palette: "Open Timeline" (coming soon)

Timeline shows:
- All meetings with that person chronologically
- Themes detected in each meeting
- Action items status
- Meeting mood trends

### Customizing Settings

Go to Settings → 1:1 Manager to configure:
- **1:1 Notes Folder**: Where meeting notes are stored (default: `1-1s`)
- **Theme Keywords**: Customize automatic theme detection

## Features in Detail

### Theme Extraction

The plugin automatically detects themes based on keywords in your notes:

- **Career Growth**: promotion, career, growth, development, advancement
- **Technical Challenges**: technical, bug, architecture, performance, complexity
- **Team Dynamics**: team, collaboration, communication, conflict
- **Workload**: workload, capacity, overwhelmed, bandwidth, burnout
- **Goals & OKRs**: goal, okr, objective, milestone, target
- **Feedback**: feedback, review, performance, improvement
- **Work-Life Balance**: balance, pto, vacation, time off, flexibility

Themes appear as colored badges in the dashboard and timeline views.

### Action Item Parsing

The plugin recognizes standard markdown checkboxes:

- `- [ ]` - Uncompleted action item
- `- [x]` - Completed action item
- `@person` - Assigned to someone
- `📅 YYYY-MM-DD` - Due date

Example:
```markdown
- [ ] Review PR #123 @sarah 📅 2026-01-25
- [x] Update documentation
```

### Best Practices

1. **Consistent Naming**: Use the same person name across all meetings for accurate tracking
2. **Use Frontmatter**: Always include person and date in frontmatter for proper parsing
3. **Add Moods**: Track meeting sentiment over time
4. **Tag Action Items**: Use `@name` and `📅 date` for better tracking
5. **Be Specific**: Mention concrete topics to help theme detection
6. **Review Dashboard**: Check weekly for incomplete action items and theme trends

## Project Structure

```
one-on-one-manager/
├── src/
│   ├── main.ts              # Plugin entry point
│   ├── settings.ts          # Settings configuration
│   ├── types.ts             # TypeScript interfaces
│   ├── analyzer.ts          # Meeting analysis engine
│   ├── dashboard-view.ts    # Dashboard UI
│   ├── timeline-view.ts     # Timeline UI
│   └── create-meeting-modal.ts  # Meeting creation modal
├── styles.css               # Plugin styles
├── manifest.json            # Plugin metadata
├── package.json             # Dependencies
└── README.md               # This file
```

## Troubleshooting

### Plugin doesn't appear in Obsidian
- Make sure you ran `npm run build`
- Check that the plugin folder is in the correct `.obsidian/plugins/` directory
- Reload Obsidian or toggle Safe mode off/on

### Dashboard is empty
- Make sure you've created some 1:1 notes in the configured folder
- Check that notes have proper frontmatter with `person` and `date` fields
- Try clicking the refresh icon in the dashboard

### Themes not detecting
- Verify your note content includes keywords from the theme list
- Check Settings → 1:1 Manager to see current theme keywords
- Keywords are case-insensitive

### Build errors
```bash
rm -rf node_modules
npm install
npm run build
```

## Development

### Building
```bash
npm run build      # Production build
npm run dev        # Development build with watch mode
```

### Linting
```bash
npm run lint
```

## License

This plugin uses the 0-BSD license.

## Contributing

Feel free to submit issues and enhancement requests!

---

**Made for engineering managers and ICs who want to level up their 1:1 game** 🚀
