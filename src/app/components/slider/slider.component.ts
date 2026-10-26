import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IonicSlides } from '@ionic/angular';

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.scss'],
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

// Aufbau nach einem Swiper-Tutorial: https://youtu.be/pidTodxQ5jA
export class SliderComponent {
  
  @ViewChild('swiper') swiperRef: ElementRef | undefined;
  @Input() slides: any[] = [];
  @Output() slideClick = new EventEmitter<number>();
  @Output() add = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();


  swiperModules = [IonicSlides];

  constructor() { }

  
  onSlideClick(index: number) {
    this.slideClick.emit(index);
  }

  toggleFavorite(index: number, event: Event) {
    event.stopPropagation(); 
    if(this.slides[index].isFavorite){
      this.slides[index].isFavorite=false;
      this.delete.emit(index);
    }
    else if(!this.slides[index].isFavorite){
      this.slides[index].isFavorite=true;
      this.add.emit(index);
    }
  }


}
