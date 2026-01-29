// ABOUTME: Settings configuration for 1:1 Manager plugin
// ABOUTME: Defines user preferences for folders, templates, and theme detection
import {App, PluginSettingTab, Setting} from "obsidian";
import OneOnOneManager from "./main";

export interface OneOnOneSettings {
	oneOnOneFolder: string;
	coachingPlansFolder: string;
	peopleProfilesFolder: string;
	defaultMoods: string[];
	themeKeywords: Record<string, string[]>;
	meetingTemplate: string;
	reflectionPrompts: ReflectionPrompt[];
}

export interface ReflectionPrompt {
	label: string;
	prompt: string;
}

export const DEFAULT_SETTINGS: OneOnOneSettings = {
	oneOnOneFolder: '1-1s',
	coachingPlansFolder: '1-1s/coaching-plans',
	peopleProfilesFolder: '1-1s/people',
	defaultMoods: ['Great', 'Good', 'Okay', 'Challenging', 'Difficult'],
	themeKeywords: {
		'Career Growth': ['promotion', 'career', 'growth', 'development', 'advancement', 'level'],
		'Technical Challenges': ['technical', 'bug', 'architecture', 'performance', 'complexity', 'debt'],
		'Team Dynamics': ['team', 'collaboration', 'communication', 'conflict', 'relationship'],
		'Workload': ['workload', 'capacity', 'overwhelmed', 'bandwidth', 'burnout', 'stress'],
		'Goals & OKRs': ['goal', 'okr', 'objective', 'milestone', 'target', 'metric'],
		'Feedback': ['feedback', 'review', 'performance', 'improvement', 'recognition'],
		'Work-Life Balance': ['balance', 'pto', 'vacation', 'time off', 'hours', 'flexibility']
	},
	meetingTemplate: `---
person: {{person}}
date: {{date}}
{{#if mood}}mood: {{mood}}{{/if}}
{{#if topics}}topics:
{{#each topics}}  - {{this}}
{{/each}}{{/if}}
---

# 1:1 with {{person}}

## Discussion

- 

## Action Items

- [ ] 

---

## 🔒 Private Notes

**My Observations:**


**Coaching Notes:**


**Follow-up for Me:**

`,
	reflectionPrompts: [
		{
			label: 'Energy & Engagement',
			prompt: 'How did they seem? What was their energy level and engagement like?'
		},
		{
			label: 'Key Observations',
			prompt: 'What stood out to you? Any changes in behavior, concerns, or wins?'
		},
		{
			label: 'Coaching Notes',
			prompt: 'What do you want to coach them on? Any patterns emerging?'
		},
		{
			label: 'Your Reaction',
			prompt: 'How do you feel about this 1:1? Any concerns or positive feelings?'
		},
		{
			label: 'Follow-up Actions',
			prompt: 'What do YOU need to do? Any commitments you made?'
		}
	]
}

export class OneOnOneSettingTab extends PluginSettingTab {
	plugin: OneOnOneManager;

	constructor(app: App, plugin: OneOnOneManager) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: '1:1 Manager Settings'});

		new Setting(containerEl)
			.setName('1:1 Notes Folder')
			.setDesc('Where to store 1:1 meeting notes')
			.addText(text => text
				.setPlaceholder('1-1s')
				.setValue(this.plugin.settings.oneOnOneFolder)
				.onChange(async (value) => {
					this.plugin.settings.oneOnOneFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Coaching Plans Folder')
			.setDesc('Where to store private coaching plans for each person')
			.addText(text => text
				.setPlaceholder('1-1s/coaching-plans')
				.setValue(this.plugin.settings.coachingPlansFolder)
				.onChange(async (value) => {
					this.plugin.settings.coachingPlansFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('People Profiles Folder')
			.setDesc('Where to store person profile information')
			.addText(text => text
				.setPlaceholder('1-1s/people')
				.setValue(this.plugin.settings.peopleProfilesFolder)
				.onChange(async (value) => {
					this.plugin.settings.peopleProfilesFolder = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', {text: '1:1 Meeting Template'});
		
		const templateDesc = containerEl.createEl('p', {
			cls: 'setting-item-description'
		});
		templateDesc.innerHTML = 'Customize the template used when creating new 1:1 meeting notes. You can use variables like <code>{{person}}</code>, <code>{{date}}</code>, <code>{{mood}}</code>, and <code>{{topics}}</code>.';

		const templateButtons = containerEl.createEl('div', {cls: 'template-buttons'});
		templateButtons.style.marginBottom = '15px';
		templateButtons.style.display = 'flex';
		templateButtons.style.gap = '10px';

		const openTemplateBtn = templateButtons.createEl('button', {
			text: '📝 Edit Template in Note',
			cls: 'mod-cta'
		});
		openTemplateBtn.addEventListener('click', async () => {
			await this.openTemplateInNote();
		});

		const loadTemplateBtn = templateButtons.createEl('button', {
			text: '⬇️ Load from Note',
		});
		loadTemplateBtn.addEventListener('click', async () => {
			await this.loadTemplateFromNote();
		});

		const resetBtn = templateButtons.createEl('button', {
			text: '🔄 Reset to Default',
			cls: 'mod-warning'
		});
		resetBtn.addEventListener('click', async () => {
			if (confirm('Reset the meeting template to default? This will overwrite your current template.')) {
				this.plugin.settings.meetingTemplate = DEFAULT_SETTINGS.meetingTemplate;
				await this.plugin.saveSettings();
				this.display(); // Refresh the settings UI
			}
		});

		new Setting(containerEl)
			.setName('Template Preview')
			.setDesc('Quick preview/edit (for advanced editing, use the "Edit Template in Note" button above)')
			.addTextArea(text => {
				text.setPlaceholder('Enter your template...')
					.setValue(this.plugin.settings.meetingTemplate)
					.onChange(async (value) => {
						this.plugin.settings.meetingTemplate = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 15;
				text.inputEl.cols = 60;
				text.inputEl.style.width = '100%';
				text.inputEl.style.fontFamily = 'monospace';
				text.inputEl.style.fontSize = '0.9em';
			});

		containerEl.createEl('h3', {text: 'Theme Detection'});
		containerEl.createEl('p', {
			text: 'Customize keywords for automatic theme detection. Edit theme keywords in settings data file for advanced customization.',
			cls: 'setting-item-description'
		});

		const themesEl = containerEl.createEl('div', {cls: 'theme-keywords-display'});
		for (const [theme, keywords] of Object.entries(this.plugin.settings.themeKeywords)) {
			themesEl.createEl('div', {
				text: `${theme}: ${keywords.join(', ')}`,
				cls: 'theme-keyword-item'
			});
		}
	}

	async openTemplateInNote(): Promise<void> {
		const templateFolder = `${this.plugin.settings.oneOnOneFolder}/.templates`;
		const templatePath = `${templateFolder}/meeting-template.md`;

		// Ensure folder exists
		const folderExists = this.app.vault.getAbstractFileByPath(templateFolder);
		if (!folderExists) {
			await this.app.vault.createFolder(templateFolder);
		}

		// Check if template file exists
		let templateFile = this.app.vault.getAbstractFileByPath(templatePath);

		const templateContent = `# 1:1 Meeting Template

This is your template for creating new 1:1 meeting notes. Edit it as you like!

**Available Variables:**
- \`{{person}}\` - Person's name
- \`{{date}}\` - Meeting date
- \`{{mood}}\` - Meeting mood (optional)
- \`{{topics}}\` - List of topics (optional)

**Note:** The plugin will automatically add:
- Outstanding action items from the last meeting
- Coaching focus areas (if any)
- Last meeting date

---

${this.plugin.settings.meetingTemplate}

---

**Instructions:**
1. Edit the template above (below the line)
2. Save this file (Ctrl/Cmd + S)
3. Go back to Settings → 1:1 Manager
4. Click "Load Template from Note" to apply your changes
`;

		if (!templateFile) {
			// Create the template file
			templateFile = await this.app.vault.create(templatePath, templateContent);
		} else {
			// Update existing file
			await this.app.vault.modify(templateFile as any, templateContent);
		}

		// Open the template file
		await this.app.workspace.openLinkText(templatePath, '', false);
	}

	async loadTemplateFromNote(): Promise<void> {
		const templatePath = `${this.plugin.settings.oneOnOneFolder}/.templates/meeting-template.md`;
		const templateFile = this.app.vault.getAbstractFileByPath(templatePath);

		if (!templateFile) {
			alert('Template file not found. Click "Edit Template in Note" first to create it.');
			return;
		}

		const content = await this.app.vault.read(templateFile as any);
		
		// Extract template between the --- markers
		const match = content.match(/---\n\n([\s\S]*?)\n\n---/);
		if (match && match[1]) {
			this.plugin.settings.meetingTemplate = match[1];
			await this.plugin.saveSettings();
			this.display(); // Refresh settings UI
			alert('✅ Template loaded successfully!');
		} else {
			alert('Could not parse template. Make sure the template is between the --- markers.');
		}
	}
}
