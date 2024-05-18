import { TextFieldModule } from '@angular/cdk/text-field';
import { ChangeDetectionStrategy, Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {MatCheckboxModule} from '@angular/material/checkbox';

@Component({
    selector       : 'settings-account',
    templateUrl    : './account.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone     : true,
    imports        : [FormsModule, ReactiveFormsModule,MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule, TextFieldModule, MatSelectModule, MatOptionModule, MatButtonModule],
})
export class SettingsAccountComponent implements OnInit
{
    accountForm: UntypedFormGroup;
    @Input() inputData;

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
    )
    {
    }

    ngOnChanges() {
        console.log(this.inputData);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Create the form
        this.accountForm = this._formBuilder.group({
            title    : [this.inputData?.student?.title],
            firstName : [this.inputData?.student?.firstName],
            lastName  : [this.inputData?.student?.lastName],
            studentLoginUrl: [this.inputData?.student?.loginUrl],
            university : [this.inputData?.student?.university?.name],
            email   : [this.inputData?.student?.personalEmail, Validators.email],
            phone   : ['121-490-33-12'],
            country : ['usa'],
            language: ['english'],
            MFAQ1: [],
            MFAQ2: [],
            MFAQ3: [],
            MFAQ4: [],
            Answer1: [],  
            Answer2: [],  
            Answer3: [],  
            Answer4: [],  
        });
    }
}
