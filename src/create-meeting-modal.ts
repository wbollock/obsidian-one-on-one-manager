// ABOUTME: Modal for creating new 1:1 meeting notes with templates
// ABOUTME: Provides structured input form for person, date, mood, and topics
import {App, Modal, Notice, TFile} from 'obsidian';
import OneOnOneManager from './main';

export class CreateMeetingModal extends Modal {
	plugin: OneOnOneManager;
	person: string = '';
	date: string = '';
	mood: string = '';
	topics: string = '';

	constructor(app: App, plugin: OneOnOneManager) {
		super(app);
		this.plugin = plugin;
		
		const today = new Date();
		this.date = today.toISOString().split('T')[0] || '';
	}

	onOpen(): void {
		const {contentEl} = this;
		contentEl.empty();

		contentEl.createEl('h2', {text: 'Create 1:1 Meeting Note'});

		const form = contentEl.createEl('form');

		this.createField(form, 'Person', 'text', this.person, (value) => {
			this.person = value;
		}, 'Name of person you met with');

		this.createField(form, 'Date', 'date', this.date, (value) => {
			this.date = value;
		});

		const moodDiv = form.createEl('div', {cls: 'form-field'});
		moodDiv.createEl('label', {text: 'Mood'});
		const moodSelect = moodDiv.createEl('select');
		moodSelect.createEl('option', {text: '-- Select --', value: ''});
		
		for (const mood of this.plugin.settings.defaultMoods) {
			moodSelect.createEl('option', {text: mood, value: mood});
		}
		
		moodSelect.addEventListener('change', () => {
			this.mood = moodSelect.value;
		});

		this.createField(form, 'Topics', 'text', this.topics, (value) => {
			this.topics = value;
		}, 'Comma-separated topics');

		const buttonDiv = form.createEl('div', {cls: 'form-buttons'});
		
		const createBtn = buttonDiv.createEl('button', {text: 'Create', type: 'submit'});
		createBtn.addEventListener('click', async (e) => {
			e.preventDefault();
			await this.createMeeting();
		});

		const cancelBtn = buttonDiv.createEl('button', {text: 'Cancel', type: 'button'});
		cancelBtn.addEventListener('click', () => {
			this.close();
		});
	}

	private createField(
		container: HTMLElement, 
		label: string, 
		type: string, 
		initialValue: string,
		onChange: (value: string) => void,
		placeholder?: string
	): void {
		const div = container.createEl('div', {cls: 'form-field'});
		div.createEl('label', {text: label});
		const input = div.createEl('input', {type});
		input.value = initialValue;
		if (placeholder) input.placeholder = placeholder;
		
		input.addEventListener('input', () => {
			onChange(input.value);
		});
	}

	async createMeeting(): Promise<void> {
		if (!this.person.trim()) {
			new Notice('Please enter a person name');
			return;
		}

		if (!this.date) {
			new Notice('Please select a date');
			return;
		}

		const folder = this.plugin.settings.oneOnOneFolder;
		const fileName = `${this.date} - ${this.person.replace(/\s+/g, '-')}.md`;
		const filePath = `${folder}/${fileName}`;

		const topicsList = this.topics
			.split(',')
			.map(t => t.trim())
			.filter(t => t.length > 0);

		const content = this.generateTemplate(this.person, this.date, this.mood, topicsList);

		try {
			const folderExists = this.app.vault.getAbstractFileByPath(folder);
			if (!folderExists) {
				await this.app.vault.createFolder(folder);
			}

			const file = await this.app.vault.create(filePath, content);
			await this.app.workspace.openLinkText(file.path, '', false);
			
			new Notice('1:1 meeting note created!');
			this.close();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Error creating note: ${message}`);
		}
	}

	private generateTemplate(person: string, date: string, mood: string, topics: string[]): string {
		let template = `---
person: ${person}
date: ${date}
`;

		if (mood) {
			template += `mood: ${mood}\n`;
		}

		if (topics.length > 0) {
			template += `topics:\n`;
			for (const topic of topics) {
				template += `  - ${topic}\n`;
			}
		}

		template += `---

# 1:1 with ${person}

**Date:** ${date}
`;

		if (mood) {
			template += `**Mood:** ${mood}\n`;
		}

		template += `
## Discussion Points

### Topic 1


### Topic 2


## Action Items

- [ ] 
- [ ] 

## Notes


## Follow-up for Next Time


---

## 🔒 Private Manager Notes

<!-- This section is just for you - won't be shared -->

**My Observations:**


**Coaching Notes:**


**My Reaction:**


**Follow-up for Me:**

`;

		return template;
	}

	onClose(): void {
		const {contentEl} = this;
		contentEl.empty();
	}
}
