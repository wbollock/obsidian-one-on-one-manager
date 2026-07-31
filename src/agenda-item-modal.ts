// ABOUTME: Modal for adding agenda items to discuss in upcoming 1:1s
import {App, Modal, Notice} from 'obsidian';
import OneOnOneManager from './main';
import {AgendaItem} from './types';

export class AgendaItemModal extends Modal {
	plugin: OneOnOneManager;
	personName: string;
	onSubmit: (item: AgendaItem) => void | Promise<void>;

	constructor(app: App, plugin: OneOnOneManager, personName: string, onSubmit: (item: AgendaItem) => void | Promise<void>) {
		super(app);
		this.plugin = plugin;
		this.personName = personName;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		contentEl.addClass('one-on-one-modal');

		contentEl.createEl('h2', {text: `Add agenda item for ${this.personName}`});
		contentEl.createEl('p', {
			text: 'Add a topic or item you want to discuss in your next 1:1',
			cls: 'modal-description'
		});

		const form = contentEl.createEl('form');
		
		const textField = form.createEl('div', {cls: 'form-field'});
		textField.createEl('label', {text: 'Topic to discuss'});
		const textInput = textField.createEl('textarea', {
			attr: {
				rows: '3',
				placeholder: 'E.g., discuss promotion timeline, get feedback on project X, address workload concerns...'
			}
		});

		const buttons = form.createEl('div', {cls: 'form-buttons'});
		
		const submitBtn = buttons.createEl('button', {
			text: 'Add item',
			type: 'submit',
			cls: 'mod-cta'
		});

		const cancelBtn = buttons.createEl('button', {
			text: 'Cancel',
			type: 'button'
		});
		cancelBtn.addEventListener('click', () => this.close());

		form.addEventListener('submit', (e) => {
			e.preventDefault();
			void this.submitItem(textInput);
		});

		textInput.focus();
	}

	private async submitItem(textInput: HTMLTextAreaElement): Promise<void> {
		const text = textInput.value.trim();
		if (!text) {
			new Notice('Please enter a topic to discuss');
			return;
		}

		try {
			const newItem = await this.plugin.peopleManager.addAgendaItem(
				this.personName,
				text,
				undefined
			);
			new Notice(`Added agenda item for ${this.personName}`);
			await this.onSubmit(newItem);
			this.close();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			new Notice(`Error: ${message}`);
		}
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
