import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SweetAlertService {

  constructor() { }

  showToast(icon: SweetAlertIcon, title: string, timer = 3000, customClass?) {
    return Swal.fire({
      icon: icon,
      title: title,
      toast: true,
      position: 'top-right',
      showConfirmButton: false,
      timer: timer,
      customClass: customClass
    });
  }

  prompt(icon: SweetAlertIcon, title: string, ok, text?) {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        title: 'text-break font_size_h5',
        confirmButton: 'btn btn-primary btn-lg',
      },
      buttonsStyling: false,
    });
    return swalWithBootstrapButtons.fire({
      allowOutsideClick: false,
      icon: icon,
      title: title,
      html: text ? text : '',
      confirmButtonText: `<button class="bg-[#029184] text-[#fff] h-10 px-4 rounded-full">${ok}</button>`
    });
  }

  confirm(icon?: SweetAlertIcon, title?: string, text?, cancel?, ok?) {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-primary ml-3',
        cancelButton: 'btn btn-outline-primary',
        title: 'text-break font_size_h5'
      },
      buttonsStyling: false,
    });
    return swalWithBootstrapButtons.fire({
      html: text,
      allowOutsideClick: false,
      icon: icon,
      title: title,
      showCancelButton: true,
      cancelButtonText: `<button class="border border-solid border-[#79747E] rounded-3xl h-10 px-4 hover:bg-[#008080] hover:text-[#FFFFFF] hover:bg-[#008080] hover:text-[#FFFFFF]">${cancel}</button>`,
    //   cancelButtonColor: '#f86c6b',
      confirmButtonText: `<button class="bg-[#029184] text-[#fff] h-10 px-4 rounded-full">${ok}</button>`,
    //   confirmButtonColor: '#4dbd74',
      reverseButtons: true,
    });
  }

  getRespectiveType(responseCode) {
    let icon = '';
    switch (responseCode) {
      case 2:
      case 4:
        icon = 'success';
        break;
      case 0:
      case 3:
        icon = 'error';
        break;
      case 5:
        icon = 'warning';
        break;
      case 6:
        icon = 'info';
        break;
      default:
        icon = 'success';
    }
    return icon;
  }
}