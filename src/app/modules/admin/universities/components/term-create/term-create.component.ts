import {
    Component,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import {
    FormGroup,
    FormBuilder,
    Validators,
    ReactiveFormsModule,
    FormsModule,
} from '@angular/forms';

import { Subscription } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SelectErrorStateMatcher } from '@fuse/directives/error-state-matcher';
import { Role } from 'app/models/role.model';
import { Title } from 'app/models/title.model';
import { UserService } from 'app/core/user/user.service';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Term } from 'app/models/term.model';
import { TermApiService } from 'app/core/term/termapi.service';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
    selector: 'app-term-create',
    templateUrl: './term-create.component.html',
    styleUrls: ['./term-create.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        FormsModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatCheckboxModule,
        MatDatepickerModule,
        DatePipe
    ],
})
export class TermCreateComponent implements OnInit, OnDestroy {
    createTermForm: FormGroup;
    matcher = new SelectErrorStateMatcher();

    roles: string[] = Object.values(Role).sort();
    titles: string[] = Object.values(Title).sort();
    term: Term = new Term();

    private primarySubscripton: Subscription = new Subscription();
    isLoggedInUserAdmin: boolean;
    appRoles = Role;
    inputData: any;

    constructor(
        private dialogRef: MatDialogRef<TermCreateComponent>,
        private formBuilder: FormBuilder,
        private termApiService: TermApiService,
        protected userService: UserService,
        @Inject(MAT_DIALOG_DATA) data
    ) {
        this.inputData = data;
        this.term = this.inputData;
    }

    ngOnDestroy(): void {
        console.info(`TermCreateComponent.ngOnDestroy`);
        this.primarySubscripton.unsubscribe();
    }

    ngOnInit(): void {
        this.primarySubscripton.add(
            this.userService.user$.subscribe((user) => {
                this.isLoggedInUserAdmin = user.role === this.appRoles.Admin;
            })
        );
        this.initializeFormValues();
    }

    /** min lenght and same as controls */
    initializeFormValues() {
        this.createTermForm = this.formBuilder.group({
            name: [this.term?.name, Validators.required],
            startDate: [this.term?.startDate, Validators.required],
            endDate: [this.term?.endDate, Validators.required],
            university: [this.term?.university, Validators.required],
            tracking: [this.term?.tracking],
            active: [this.term?.active, Validators.required],
        });
    }

    get f() {
        return this.createTermForm.controls;
    }

    submit(): void {
        console.log(this.createTermForm);
        if (this.createTermForm.invalid) {
            console.info('component.submit form invalid');
            return;
        }

        if (this.term.id) {
            this.primarySubscripton.add(
                this.termApiService.editTerm(this.createTermForm.value, this.term.id).subscribe(
                    (data) => {
                        console.info(`Updated Term successfully`);
                        this.dialogRef.close({success: true});
                    },
                    (error) => {
                        console.info(`Error updating Term: ${error}`);
                        // this.alertService.error(`Unable to register Term. ${error}`);
                        // this.dialogRef.close(null);
                    }
                )
            );
        } else {

            this.primarySubscripton.add(
                this.termApiService.createTerm(this.createTermForm.value).subscribe(
                    (data) => {
                        console.info(`Saved Term successfully`);
                        this.dialogRef.close({ success: true });
                    },
                    (error) => {
                        console.info(`Error saving Term: ${error}`);
                        // this.alertService.error(`Unable to register Term. ${error}`);
                        // this.dialogRef.close(null);
                    }
                )
            );
        }
    }

    dismiss(): void {
        this.dialogRef.close(null);
    }
}
