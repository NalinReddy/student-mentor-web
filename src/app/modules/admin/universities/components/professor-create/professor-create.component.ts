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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ProfessorApiService } from 'app/core/professor/professorsapi.service';
import { Professor } from 'app/models/professor.model';

@Component({
    selector: 'app-professor-create',
    templateUrl: './professor-create.component.html',
    styleUrls: ['./professor-create.component.scss'],
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
export class ProfessorCreateComponent implements OnInit, OnDestroy {
    createProfessorForm: FormGroup;
    matcher = new SelectErrorStateMatcher();

    roles: string[] = Object.values(Role).sort();
    titles: string[] = Object.values(Title).sort();
    professor: Professor = new Professor();

    private primarySubscripton: Subscription = new Subscription();
    isLoggedInUserAdmin: boolean;
    appRoles = Role;
    inputData: any;

    constructor(
        private dialogRef: MatDialogRef<ProfessorCreateComponent>,
        private formBuilder: FormBuilder,
        private professorApiService: ProfessorApiService,
        protected userService: UserService,
        @Inject(MAT_DIALOG_DATA) data
    ) {
        this.inputData = data;
        this.professor = this.inputData;
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
        this.createProfessorForm = this.formBuilder.group({
            title: [this.professor?.title, Validators.required],
            firstName: [this.professor?.firstName, Validators.required],
            lastName: [this.professor?.lastName, Validators.required],
            university: [this.professor?.university, Validators.required],
            tracking: [this.professor?.tracking],
            active: [this.professor?.active, Validators.required],
        });
    }

    get f() {
        return this.createProfessorForm.controls;
    }

    submit(): void {
        console.log(this.createProfessorForm);
        if (this.createProfessorForm.invalid) {
            console.info('component.submit form invalid');
            return;
        }

        if (this.professor.id) {
            this.primarySubscripton.add(
                this.professorApiService.editProfessor(this.createProfessorForm.value, this.professor.id).subscribe(
                    (data) => {
                        console.info(`Updated Professor successfully`);
                        this.dialogRef.close({success: true});
                    },
                    (error) => {
                        console.info(`Error updating Professor: ${error}`);
                        // this.alertService.error(`Unable to register Professor. ${error}`);
                        // this.dialogRef.close(null);
                    }
                )
            );
        } else {

            this.primarySubscripton.add(
                this.professorApiService.createProfessor(this.createProfessorForm.value).subscribe(
                    (data) => {
                        console.info(`Saved Professor successfully`);
                        this.dialogRef.close({ success: true });
                    },
                    (error) => {
                        console.info(`Error saving Professor: ${error}`);
                        // this.alertService.error(`Unable to register Professor. ${error}`);
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
