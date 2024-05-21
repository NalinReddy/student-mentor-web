import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ReactiveFormsModule,
    FormsModule,
    FormGroup,
    FormBuilder,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { SelectErrorStateMatcher } from '@fuse/directives/error-state-matcher';
import { TopicLookup, TopicsApiService } from 'app/core/tasks/topicsapi.service';
import { Subscription } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { cloneDeep } from 'lodash';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-create-topic',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        FormsModule,
        MatIconModule,
        MatSelectModule,
        MatInputModule,
        MatButtonModule,
        MatTableModule,
        MatSlideToggleModule
    ],
    templateUrl: './create-topic.component.html',
    styleUrls: ['./create-topic.component.scss'],
})
export class CreateTopicComponent {
    createTopicLookupForm: FormGroup;
    matcher = new SelectErrorStateMatcher();
    inputData: any;
    private primarySubscripton: Subscription = new Subscription();
    columns = [
      "name", "active"
    ];
    topics: {name: string; active: boolean; tracking: any}[] = [];
    categories = [];

    /**
     *
     */
    constructor(
        private dialogRef: MatDialogRef<CreateTopicComponent>,
        private formBuilder: FormBuilder,
        private topicApiService: TopicsApiService,
        @Inject(MAT_DIALOG_DATA) data
    ) {
        this.inputData = data;
        this.primarySubscripton.add(
          this.topicApiService.topicLookup.subscribe((data) => {
              this.topics = cloneDeep(data);
          })
      );
    }

    ngOnDestroy(): void {
        console.info(`CreateTopicComponent.ngOnDestroy`);
        this.primarySubscripton.unsubscribe();
    }

    ngOnInit(): void {
        this.primarySubscripton.add(
            this.topicApiService.getTopicCategories()
            .subscribe(cats => this.categories = cats)
        );
        
      this.topicApiService.getAllTopicLookups();
        this.initializeFormValues();
    }

    /** min lenght and same as controls */
    initializeFormValues() {
        this.createTopicLookupForm = this.formBuilder.group({
            category: [this.inputData?.category, [Validators.required]],
            name: [this.inputData?.name, [Validators.required]],
            active: [this.inputData?.active ?? true],
            tracking: [this.inputData?.tracking]
        });
    }

    get f() {
        return this.createTopicLookupForm.controls;
    }

    submit(): void {
        console.log(this.createTopicLookupForm);
        if (this.createTopicLookupForm.invalid) {
            console.info('component.submit form invalid');
            return;
        }

        if (this.inputData?.id) {
            this.primarySubscripton.add(
                this.topicApiService
                    .updateTopicLookup(this.createTopicLookupForm.value, this.inputData.id)
                    .subscribe(
                        (data) => {
                            console.info(`Updated Topic lookup successfully`);
                            // this.dialogRef.close(null);
                            this.resetEdit();
                        },
                        (error) => {
                            console.info(`Error saving Topic lookup: ${error}`);
                        }
                    )
            );
            return;
        }

        this.primarySubscripton.add(
            this.topicApiService
                .createTopicLookup(this.createTopicLookupForm.value)
                .subscribe(
                    (data) => {
                        console.info(`Saved Topic lookup successfully`);
                        this.dialogRef.close(null);
                    },
                    (error) => {
                        console.info(`Error saving Topic lookup: ${error}`);
                    }
                )
        );
    }

    edit(topic: TopicLookup) {
        this.resetEdit();
        setTimeout(() => {
            const cloned = cloneDeep(topic);
            delete cloned.id;
            this.createTopicLookupForm.setValue({...cloned, category: topic.category ? topic.category : null});
            this.inputData = topic;
        }, 0)
        
    }
    resetEdit() {
        this.createTopicLookupForm.reset();
        this.createTopicLookupForm.controls.active.setValue(true);
        this.createTopicLookupForm.markAsPristine();
        this.createTopicLookupForm.markAsUntouched();
        if (this.inputData?.id) {
            this.inputData = null;
            return;
        };
    }

    dismiss(): void {
        if (this.inputData?.id) {
            this.resetEdit();
            return;
        };
        this.dialogRef.close(null);
    }
}
