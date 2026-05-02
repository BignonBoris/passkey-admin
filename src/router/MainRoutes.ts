




const MainRoutes = [
    {
        path: '/admin',
        component: () => import('../layouts/full/FullLayout.vue'),
        children: [
            {
                path: '',
                name: 'Modern',
                component: () => import('../views/dashboards/PassKeyDashboard.vue'),
            },

            {
                name: 'Notes',
                path: 'apps/notes',
                component: () => import('../views/apps/notes/Notes.vue')
            },
            {
                name: 'Rides',
                path: 'rides',
                component: () => import('../views/rides/RidesList.vue')
            },
            {
                name: 'Incidents',
                path: 'incidents',
                component: () => import('../views/incidents/IncidentsList.vue')
            },
            {
                name: 'Tickets',
                path: 'apps/tickets',
                component: () => import('../views/apps/tickets/Tickets.vue')
            },
            {
                name: 'Blog Posts',
                path: 'apps/blog/post',
                component: () => import('../views/apps/blog/Posts.vue')
            },
            {
                name: 'Blog Details',
                path: 'apps/blog/:slug',
                component: () => import('../views/apps/blog/[id].vue')
            },
            {
                name: 'Icon',
                path: 'icons/solar',
                component: () => import('../views/icons/Solar.vue')
            },
            {
                name: 'Shadcn Table',
                path: 'shadcn-table/basic',
                component: () => import('../views/shadcn-tables/BasicTable.vue')
            },
            {
                name: 'Shadcn Hover Table',
                path: 'shadcn-table/hover',
                component: () => import('../views/shadcn-tables/HoverTable.vue')
            },
            {
                name: 'Form',
                path: 'utilities/form',
                component: () => import('../views/utilities/Form.vue')
            },
            {
                name: 'User Profile',
                path: 'user-profile',
                component: () => import('../views/utilities/UserProfile.vue')
            },
            {
                name: 'Driver Profiles',
                path: 'drivers/profiles',
                component: () => import('../views/users/DriverProfiles.vue')
            },
            {
                name: 'Usagers',
                path: 'users/usagers',
                component: () => import('../views/users/UsagersList.vue')
            },
            {
                name: 'Admins',
                path: 'users/admins',
                component: () => import('../views/users/AdminsList.vue')
            },
            {
                name: 'Drivers',
                path: 'users/drivers',
                component: () => import('../views/users/DriversList.vue')
            },
            {
                name: 'Drivers Commissions',
                path: 'drivers/commissions',
                component: () => import('../views/users/DriversCommissions.vue')
            },
            {
                name: 'Vehicles',
                path: 'vehicles/drivers',
                component: () => import('../views/resources/VehiclesList.vue')
            },
            {
                name: 'Pricing rates',
                path: 'pricing/rates',
                component: () => import('../views/pricing/PricingRates.vue')
            },
            {
                name: 'Pricing rules',
                path: 'pricing/rules',
                component: () => import('../views/pricing/PricingRules.vue')
            },
            {
                name: 'Drivers revenue',
                path: 'revenue/drivers',
                component: () => import('../views/revenue/VehicleRevenueConfig.vue')
            },
            {
                name: 'Revenue vehicule legacy',
                path: 'revenue/vehicle-config',
                component: () => import('../views/revenue/VehicleRevenueConfig.vue')
            },
            {
                name: 'Support tickets',
                path: 'support/tickets',
                component: () => import('../views/support/SupportTickets.vue')
            },
            {
                name: 'Faq management',
                path: 'support/faqs',
                component: () => import('../views/resources/FaqManagement.vue')
            },
            {
                name: 'Settings management',
                path: 'configuration/parametres',
                component: () => import('../views/resources/SettingsManagement.vue')
            },
            {
                name: 'Restaurants management',
                path: 'food/restaurants',
                component: () => import('../views/resources/RestaurantsManagement.vue')
            },
            {
                name: 'Restaurant workspace',
                path: 'restaurant/workspace',
                component: () => import('../views/resources/RestaurantWorkspace.vue')
            },
        ],
    },
];



export default MainRoutes;
