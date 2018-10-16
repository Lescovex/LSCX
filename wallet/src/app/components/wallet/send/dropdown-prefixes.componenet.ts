import { Component, Input, Output, EventEmitter } from '@angular/core';
@Component({
    selector: 'dropdown-prefixes',
    templateUrl: './dropdown-prefixes.html',
    host: {
      '(document:keydown)': 'goToCountry($event)'
    }
})
  
export class DropdownPrefixes {
    @Input() countries: any[];

    @Output() update = new EventEmitter<any>();

    constructor() {

    }

    goToCountry(event){
        let countriesByLetter = this.countries.filter(x=> x.name.startsWith(event.key.toUpperCase()));
        if( countriesByLetter.length > 0){
            let el = document.getElementById(countriesByLetter[0].name);
            if (el) el.scrollIntoView();
        }
    }

    onSelectCountry(country){
        this.update.emit(country);
    }

    closeDropdown() {
        this.update.emit(null);
    }
}