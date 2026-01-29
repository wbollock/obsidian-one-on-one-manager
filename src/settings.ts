// ABOUTME: Settings configuration for 1:1 Manager plugin
// ABOUTME: Defines user preferences for folders and templates
import {App, PluginSettingTab, Setting} from "obsidian";
import OneOnOneManager from "./main";

export interface OneOnOneSettings {
	oneOnOneFolder: string;
	peopleProfilesFolder: string;
	defaultMoods: string[];
	meetingTemplate: string;
	reflectionPrompts: ReflectionPrompt[];
}

export interface ReflectionPrompt {
	label: string;
	prompt: string;
}

export const DEFAULT_SETTINGS: OneOnOneSettings = {
	oneOnOneFolder: '1-1s',
	peopleProfilesFolder: '1-1s/people',
	defaultMoods: ['Great', 'Good', 'Okay', 'Challenging', 'Difficult'],
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
		templateDesc.innerHTML = 'Customize the template used when creating new 1:1 meeting notes. Edit the template file and changes automatically apply. You can use variables like <code>{{person}}</code> and <code>{{date}}</code>.';

		const templateButtons = containerEl.createEl('div', {cls: 'template-buttons'});
		templateButtons.style.marginBottom = '15px';
		templateButtons.style.display = 'flex';
		templateButtons.style.gap = '10px';

		const openTemplateBtn = templateButtons.createEl('button', {
			text: '📝 Edit Template',
			cls: 'mod-cta'
		});
		openTemplateBtn.addEventListener('click', async () => {
			await this.openTemplateInNote();
		});

		new Setting(containerEl)
			.setName('Template Fallback')
			.setDesc('This is only used if the template file does not exist. Edit the template file above for changes to apply automatically.')
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
	}

	async openTemplateInNote(): Promise<void> {
		try {
			const templateFolder = `${this.plugin.settings.oneOnOneFolder}/templates`;
			const templatePath = `${templateFolder}/meeting-template.md`;

			// Ensure parent folder exists
			const parentFolder = this.plugin.settings.oneOnOneFolder;
			const parentExists = await this.app.vault.adapter.exists(parentFolder);
			if (!parentExists) {
				await this.app.vault.createFolder(parentFolder);
			}

			// Ensure template folder exists
			const folderExists = await this.app.vault.adapter.exists(templateFolder);
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
1. Edit the template above (between the --- markers)
2. Save this file (Ctrl/Cmd + S)
3. Your changes will automatically apply to all new 1:1 meetings!
`;

			if (!templateFile) {
				// Create the template file - or open if it already exists
				try {
					templateFile = await this.app.vault.create(templatePath, templateContent);
				} catch (error) {
					// If file already exists, just try to get it again
					console.log('File creation note:', error);
					templateFile = this.app.vault.getAbstractFileByPath(templatePath);
					if (templateFile) {
						// Update the existing file
						await this.app.vault.modify(templateFile as any, templateContent);
					}
				}
			} else {
				// Update existing file
				await this.app.vault.modify(templateFile as any, templateContent);
			}

			// Open the template file
			await this.app.workspace.openLinkText(templatePath, '', false);
		} catch (error) {
			console.error('Error opening template:', error);
			const message = error instanceof Error ? error.message : 'Unknown error';
			alert(`❌ Error opening template: ${message}\n\nPlease check that the folder ${this.plugin.settings.oneOnOneFolder} exists.`);
		}
	}

	async loadTemplateFromNote(): Promise<void> {
		const templatePath = `${this.plugin.settings.oneOnOneFolder}/templates/meeting-template.md`;
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
