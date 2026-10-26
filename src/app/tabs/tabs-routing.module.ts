import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
    path: 'tab1',
    children: [
      {
        path: '',
        loadChildren: () => import('../tab1/tab1.module').then(m => m.Tab1PageModule)
      },
      {
        path: 'detail',
        loadChildren: () => import('../pages/detail-page/detail-page.module').then(m => m.DetailPagePageModule)
      }
    ]
  },
    {
      path: 'tab2',
      children: [
        {
          path: '',
          loadChildren: () => import('../tab2/tab2.module').then(m => m.Tab2PageModule)
        },
        {
          path: 'detail',
          loadChildren: () => import('../pages/detail-page/detail-page.module').then(m => m.DetailPagePageModule)
        }
      ]
    },
    {
      path: 'tab3',
      children: [
        {
          path: '',
          loadChildren: () => import('../tab3/tab3.module').then(m => m.Tab3PageModule),
        },
        {
          path: 'trip-overview',
          loadChildren: () => import('../pages/trip-overview/trip-overview.module').then(m => m.TripOverviewPageModule)
        },
        {
          path: 'detail',
          loadChildren: () => import('../pages/detail-page/detail-page.module').then(m => m.DetailPagePageModule)
        }
      ]
    },
    {
      path: 'tab4',
      children: [
        {
          path: '',
          loadChildren: () => import('../tab4/tab4.module').then(m => m.Tab4PageModule),
        },    
      ]
    },
    {
      path: 'tab5',
      children: [
        {
          path: '',
          loadChildren: () => import('../tab5/tab5.module').then(m => m.Tab5PageModule)
        },
        {
          path: 'detail',
          loadChildren: () => import('../pages/detail-page/detail-page.module').then(m => m.DetailPagePageModule)
        }
      ]
    },
]
},
{
path: '',
redirectTo: '/tabs/tab1',
pathMatch: 'full'
}
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
