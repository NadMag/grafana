///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import coreModule from 'app/core/core_module';
import appEvents from 'app/core/app_events';

export class FolderPickerCtrl {
  initialTitle: string;
  initialFolderId?: number;
  labelClass: string;
  onChange: any;
  onLoad: any;
  rootName = 'Root';
  folder: any;
  enableCreateNew: boolean;
  createNewFolder: boolean;
  newFolderName: string;
  newFolderNameTouched: boolean;
  newFolderNameExists: boolean;
  isValidSelection = true;

  /** @ngInject */
  constructor(private backendSrv) {
    if (!this.labelClass) {
      this.labelClass = "width-7";
    }

    if (this.initialFolderId && this.initialFolderId > 0) {
      this.getOptions('').then(result => {
        this.folder = _.find(result, {value: this.initialFolderId});
        this.onFolderLoad();
      });
    } else {
      if (this.initialTitle) {
        this.folder = {text: this.initialTitle, value: null};
      } else {
        this.folder = {text: this.rootName, value: 0};
      }

      this.onFolderLoad();
    }
  }

  getOptions(query) {
    var params = {
      query: query,
      type: 'dash-folder',
    };

    return this.backendSrv.search(params).then(result => {
      if (query === '' ||
          query.toLowerCase() === "r" ||
          query.toLowerCase() === "ro" ||
          query.toLowerCase() === "roo" ||
          query.toLowerCase() === "root") {
        result.unshift({title: this.rootName, id: 0});
      }

      if (this.enableCreateNew && query === '') {
        result.unshift({title: '-- New Folder --', id: -1});
      }

      return _.map(result, item => {
        return {text: item.title, value: item.id};
      });
    });
  }

  onFolderLoad() {
    if (this.onLoad) {
      this.onLoad({$folder: {id: this.folder.value, title: this.folder.text}});
    }
  }

  onFolderChange(option) {
    if (option.value === -1) {
      this.createNewFolder = true;
      this.isValidSelection = false;
      return;
    }
    this.onChange({$folder: {id: option.value, title: option.text}});
  }

  newFolderNameChanged() {
    this.newFolderNameTouched = true;

    this.backendSrv.search({query: this.newFolderName}).then(res => {
      this.newFolderNameExists = false;
      for (let hit of res) {
        if (this.newFolderName.toLowerCase() === hit.title.toLowerCase()) {
          this.newFolderNameExists = true;
          break;
        }
      }
    });
  }

  isNewFolderNameValid() {
    return this.newFolderName && !this.newFolderNameExists;
  }

  getValidationError() {
    if (!this.newFolderName) {
      return 'A Folder should have a name';
    }

    if (this.newFolderNameExists) {
      return 'A Folder or Dashboard with the same name already exists';
    }

    return '';
  }

  createFolder(evt) {
    if (evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }

    if (!this.newFolderName || this.newFolderName.trim().length === 0) {
      return;
    }

    const title = this.newFolderName.trim();

    return this.backendSrv.createDashboardFolder(title).then(result => {
      appEvents.emit('alert-success', ['Folder Created', 'OK']);

      this.createNewFolder = false;
      this.isValidSelection = true;
      this.folder = {text: title, value: result.dashboard.id};
      this.onFolderChange(this.folder);
    });
  }

  cancelCreateFolder(evt) {
    this.createNewFolder = false;
    this.isValidSelection = true;

    if (evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }

    if (this.initialFolderId && this.initialFolderId > 0) {
      this.getOptions('').then(result => {
        this.folder = _.find(result, {value: this.initialFolderId});
      });
    } else {
      if (this.initialTitle) {
        this.folder = {text: this.initialTitle, value: null};
      } else {
        this.folder = {text: this.rootName, value: 0};
      }
    }
  }
}

const template = `
<div class="gf-form-inline">
  <div class="gf-form">
    <label class="gf-form-label {{ctrl.labelClass}}">Folder</label>
    <div class="dropdown" ng-hide="ctrl.createNewFolder">
      <gf-form-dropdown model="ctrl.folder"
        get-options="ctrl.getOptions($query)"
        on-change="ctrl.onFolderChange($option)">
      </gf-form-dropdown>
    </div>
    <input type="text"
      class="gf-form-input max-width-10"
      ng-show="ctrl.createNewFolder"
      give-focus="ctrl.createNewFolder"
      ng-model="ctrl.newFolderName"
      ng-model-options="{ debounce: 400 }"
      ng-class="{'validation-error': !ctrl.isNewFolderNameValid()}"
      ng-change="ctrl.newFolderNameChanged()"
      placeholder="New folder name" />
  </div>
  <div class="gf-form" ng-show="ctrl.createNewFolder">
    <label class="gf-form-label text-success"
      ng-show="ctrl.isNewFolderNameValid()">
      <i class="fa fa-check"></i>
    </label>
  </div>
  <div class="gf-form" ng-show="ctrl.createNewFolder">
    <button class="gf-form-label"
      ng-click="ctrl.createFolder($event)"
      ng-disabled="!ctrl.isNewFolderNameValid()">
      <i class="fa fa-fw fa-save"></i>&nbsp;Create
    </button>
  </div>
  <div class="gf-form" ng-show="ctrl.createNewFolder">
    <a class="gf-form-label"
      ng-click="ctrl.cancelCreateFolder($event)">
      Cancel
    </a>
  </div>
</div>
<div class="gf-form-inline" ng-if="ctrl.newFolderNameTouched && !ctrl.isNewFolderNameValid()">
  <div class="gf-form gf-form--grow">
    <label class="gf-form-label text-warning gf-form-label--grow">
      <i class="fa fa-warning"></i>
      {{ctrl.getValidationError()}}
    </label>
  </div>
</div>
`;

export function folderPicker() {
  return {
    restrict: 'E',
    template: template,
    controller: FolderPickerCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
    scope: {
      initialTitle: '<',
      initialFolderId: '<',
      labelClass: '@',
      rootName: '@',
      onChange: '&',
      onLoad: '&',
      enableCreateNew: '@',
      isValidSelection: '='
    }
  };
}

coreModule.directive('folderPicker', folderPicker);
