// ABOUTME: Modal for creating new 1:1 meeting notes with templates
// ABOUTME: Provides structured input form for person, date, mood, and topics
import {App, Modal, Notice, TFile} from 'obsidian';
import OneOnOneManager from './main';
import {MeetingAnalyzer} from './analyzer';
import {OneOnOneMeeting} from './types';

interface MeetingContext {
	previousMeeting: OneOnOneMeeting | null;
	daysSinceLastMeeting: number | null;
	incompleteActionItems: string[];
	followUpItems: string[];
}

export class CreateMeetingModal extends Modal {
	plugin: OneOnOneManager;
	person: string = '';
	date: string = '';
	topics: string = '';
	analyzer: MeetingAnalyzer;
	onMeetingCreated?: () => void | Promise<void>;

	constructor(app: App, plugin: OneOnOneManager, onMeetingCreated?: () => void | Promise<void>) {
		super(app);
		this.plugin = plugin;
		this.analyzer = new MeetingAnalyzer(this.app, plugin.settings);
		this.onMeetingCreated = onMeetingCreated;

		const today = new Date();
		this.date = today.toISOString().split('T')[0] || '';
	}

	onOpen(): void {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.addClass('one-on-one-modal');

		contentEl.createEl('h2', {text: 'Create 1:1 Meeting Note'});

		const description = contentEl.createEl('p', {cls: 'modal-description'});
		description.setText('Create a new 1:1 meeting note with structured sections for discussion points, action items, and private notes.');

		const form = contentEl.createEl('form');

		// Person field with autocomplete suggestion
		const personDiv = form.createEl('div', {cls: 'form-field'});
		const personLabel = personDiv.createEl('label', {text: 'Person'});
		personLabel.createEl('span', {text: ' *', cls: 'required-indicator'});
		const personInput = personDiv.createEl('input', {type: 'text'});
		personInput.value = this.person;
		personInput.placeholder = 'e.g., John Smith';
		personInput.addEventListener('input', () => {
			this.person = personInput.value;
		});
		
		// Auto-focus on person field
		setTimeout(() => personInput.focus(), 10);

		// Date field
		const dateDiv = form.createEl('div', {cls: 'form-field'});
		const dateLabel = dateDiv.createEl('label', {text: 'Date'});
		dateLabel.createEl('span', {text: ' *', cls: 'required-indicator'});
		const dateInput = dateDiv.createEl('input', {type: 'date'});
		dateInput.value = this.date;
		dateInput.addEventListener('input', () => {
			this.date = dateInput.value;
		});

		// Topics field
		const topicsDiv = form.createEl('div', {cls: 'form-field'});
		topicsDiv.createEl('label', {text: 'Discussion Topics (Optional)'});
		const topicsInput = topicsDiv.createEl('input', {type: 'text'});
		topicsInput.value = this.topics;
		topicsInput.placeholder = 'e.g., Career goals, Current project, Team feedback';
		const topicsHint = topicsDiv.createEl('small', {cls: 'field-hint'});
		topicsHint.setText('💡 Separate multiple topics with commas');
		topicsInput.addEventListener('input', () => {
			this.topics = topicsInput.value;
		});

		const buttonDiv = form.createEl('div', {cls: 'form-buttons'});
		
		const createBtn = buttonDiv.createEl('button', {text: 'Create 1:1 Note', type: 'submit', cls: 'mod-cta'});
		createBtn.addEventListener('click', async (e) => {
			e.preventDefault();
			createBtn.disabled = true;
			createBtn.setText('Creating...');
			await this.createMeeting();
			createBtn.disabled = false;
			createBtn.setText('Create 1:1 Note');
		});

		const cancelBtn = buttonDiv.createEl('button', {text: 'Cancel', type: 'button'});
		cancelBtn.addEventListener('click', () => {
			this.close();
		});
		
		// Handle Enter key on form
		form.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				createBtn.click();
			}
		});
	}

	async createMeeting(): Promise<void> {
		// Validation
		if (!this.person.trim()) {
			new Notice('⚠️ Please enter a person name', 3000);
			return;
		}

		if (!this.date) {
			new Notice('⚠️ Please select a date', 3000);
			return;
		}

		const personSlug = this.person.trim().replace(/\s+/g, '-').toLowerCase();
		const personFolder = `${this.plugin.settings.oneOnOneFolder}/${personSlug}`;
		const fileName = `${this.date}.md`;
		const filePath = `${personFolder}/${fileName}`;

		// Check if file already exists
		const existingFile = this.app.vault.getAbstractFileByPath(filePath);
		if (existingFile instanceof TFile) {
			new Notice(`⚠️ A 1:1 note for ${this.person} on ${this.date} already exists`, 4000);
			await this.app.workspace.openLinkText(filePath, '', false);
			this.close();
			return;
		}

		const topicsList = this.topics
			.split(',')
			.map(t => t.trim())
			.filter(t => t.length > 0);

		const context = await this.gatherMeetingContext(this.person.trim());
		const content = await this.generateTemplate(this.person.trim(), this.date, topicsList, context);

		try {
			const folderExists = this.app.vault.getAbstractFileByPath(personFolder);
			if (!folderExists) {
				await this.app.vault.createFolder(personFolder);
			}

			const file = await this.app.vault.create(filePath, content);
			
			// Call the callback before navigating away
			if (this.onMeetingCreated) {
				await this.onMeetingCreated();
			}
			
			await this.app.workspace.openLinkText(file.path, '', false);

			new Notice(`✅ 1:1 note created for ${this.person}`, 3000);
			this.close();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`❌ Error creating note: ${message}`, 5000);
		}
	}

	private async gatherMeetingContext(person: string): Promise<MeetingContext> {
		const previousMeeting = await this.getPreviousMeeting(person);

		let daysSinceLastMeeting: number | null = null;
		let incompleteActionItems: string[] = [];
		let followUpItems: string[] = [];

		if (previousMeeting) {
			const lastDate = new Date(previousMeeting.date);
			const currentDate = new Date(this.date);
			const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
			daysSinceLastMeeting = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

			incompleteActionItems = previousMeeting.actionItems
				.filter(item => !item.completed)
				.map(item => item.text);

			followUpItems = this.extractFollowUpItems(previousMeeting.content);
		}

		return {
			previousMeeting,
			daysSinceLastMeeting,
			incompleteActionItems,
			followUpItems
		};
	}

	private async getPreviousMeeting(person: string): Promise<OneOnOneMeeting | null> {
		const allMeetings = await this.analyzer.getAllMeetings();
		const personMeetings = allMeetings
			.filter(m => m.person === person)
			.sort((a, b) => b.date.localeCompare(a.date));

		return personMeetings[0] || null;
	}

	private extractFollowUpItems(content: string): string[] {
		const followUpSection = content.match(/## 🔄 Follow-up for Next Time\s*([\s\S]*?)(?=\n##|$)/);
		if (!followUpSection || !followUpSection[1]) return [];

		const items = followUpSection[1]
			.split('\n')
			.map(line => line.trim())
			.filter(line => line.startsWith('-'))
			.map(line => line.replace(/^-\s*/, '').trim())
			.filter(line => line.length > 0);

		return items;
	}

	private async loadTemplateFromFile(): Promise<string> {
		const templatePath = `${this.plugin.settings.oneOnOneFolder}/templates/meeting-template.md`;
		const templateFile = this.app.vault.getAbstractFileByPath(templatePath);

		if (!templateFile || !(templateFile instanceof TFile)) {
			return this.plugin.settings.meetingTemplate;
		}

		try {
			const content = await this.app.vault.read(templateFile);
			const match = content.match(/---\n\n([\s\S]*?)\n\n---/);
			if (match && match[1]) {
				return match[1];
			}
		} catch (error) {
			console.log('Could not read template file, using settings:', error);
		}

		return this.plugin.settings.meetingTemplate;
	}

	private async generateTemplate(person: string, date: string, topics: string[], context: MeetingContext): Promise<string> {
		// Start with frontmatter
		let template = `---
person: ${person}
date: ${date}
`;

		if (topics.length > 0) {
			template += `topics:\n`;
			for (const topic of topics) {
				template += `  - ${topic}\n`;
			}
		}

		template += `---\n\n`;

		// Add context information at the top if available
		if (context.previousMeeting && context.daysSinceLastMeeting !== null) {
			template += `*Last 1:1: ${context.previousMeeting.date} (${context.daysSinceLastMeeting} days ago)*\n\n`;
		}

		// Add context section if we have previous meeting data
		if (context.incompleteActionItems.length > 0 || context.followUpItems.length > 0) {
			template += `## 🔄 Follow-up from Last Time\n\n`;
			
			if (context.incompleteActionItems.length > 0) {
				template += `### Outstanding Action Items\n\n`;
				for (const item of context.incompleteActionItems) {
					template += `- [ ] ${item}\n`;
				}
				template += `\n`;
			}

			if (context.followUpItems.length > 0) {
				template += `### Topics to Revisit\n\n`;
				for (const item of context.followUpItems) {
					template += `- ${item}\n`;
				}
				template += `\n`;
			}

			template += `---\n\n`;
		}

		// Now insert the user's custom template
		// Try to load from template file first, otherwise use settings
		let userTemplate = await this.loadTemplateFromFile();
		userTemplate = userTemplate.replace(/\{\{person\}\}/g, person);
		userTemplate = userTemplate.replace(/\{\{date\}\}/g, date);
		
		// Remove mood conditionals
		const moodConditional = new RegExp('\\{\\{#if mood\\}\\}[\\s\\S]*?\\{\\{/if\\}\\}', 'g');
		userTemplate = userTemplate.replace(moodConditional, '');
		
		if (topics.length > 0) {
			let topicsList = '';
			for (const topic of topics) {
				topicsList += `  - ${topic}\n`;
			}
			const topicsConditional = new RegExp('\\{\\{#if topics\\}\\}topics:\\n\\{\\{#each topics\\}\\}  - \\{\\{this\\}\\}\\n\\{\\{/each\\}\\}\\{\\{/if\\}\\}', 'g');
			userTemplate = userTemplate.replace(topicsConditional, `topics:\n${topicsList}`);
		} else {
			const topicsConditional = new RegExp('\\{\\{#if topics\\}\\}[\\s\\S]*?\\{\\{/if\\}\\}', 'g');
			userTemplate = userTemplate.replace(topicsConditional, '');
		}

		// Remove the frontmatter from user template since we already added it
		const frontmatterRegex = new RegExp('^---\\n[\\s\\S]*?\\n---\\n\\n', '');
		userTemplate = userTemplate.replace(frontmatterRegex, '');

		template += userTemplate;

		return template;
	}

	onClose(): void {
		const {contentEl} = this;
		contentEl.empty();
	}
}
