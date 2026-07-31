// ABOUTME: Fuzzy-searchable modal for picking a direct report by name
// ABOUTME: Backs the dashboard's single-click "New 1:1" quick action
import {App, FuzzySuggestModal} from 'obsidian';

export class PersonPickerModal extends FuzzySuggestModal<string> {
	private people: string[];
	private onChoose: (person: string) => void;

	constructor(app: App, people: string[], onChoose: (person: string) => void) {
		super(app);
		this.people = people;
		this.onChoose = onChoose;
		this.setPlaceholder('Which direct report?');
	}

	getItems(): string[] {
		return this.people;
	}

	getItemText(person: string): string {
		return person;
	}

	onChooseItem(person: string): void {
		this.onChoose(person);
	}
}
