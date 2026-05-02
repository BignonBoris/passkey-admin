import type { menu } from "./sidebarItems";

const adminRoles = ["admin", "sous-admin"];

const sidebarItem: menu[] = [
  { header: "Principal", roles: adminRoles },
  {
    title: "Dashboard",
    icon: "home-smile-linear",
    to: "/admin",
    isPro: false,
    roles: adminRoles,
  },

  { header: "Operations", roles: adminRoles },
  {
    title: "Courses",
    icon: "route-linear",
    to: "/admin/rides",
    isPro: false,
    roles: adminRoles,
  },
  {
    title: "Incidents",
    icon: "danger-triangle-linear",
    to: "/admin/incidents",
    isPro: false,
    roles: adminRoles,
  },

  { header: "Utilisateurs", roles: adminRoles },
  {
    title: "Usagers",
    icon: "user-circle-linear",
    to: "/admin/users/usagers",
    isPro: false,
    roles: adminRoles,
  },
  {
    title: "Livreurs",
    icon: "users-group-rounded-linear",
    to: "/admin/users/drivers",
    isPro: false,
    roles: adminRoles,
  },
  {
    title: "Rapport Commissions",
    icon: "bill-list-linear",
    to: "/admin/drivers/commissions",
    isPro: false,
    roles: adminRoles,
  },
  {
    title: "Admins",
    icon: "user-id-linear",
    to: "/admin/users/admins",
    isPro: false,
    roles: adminRoles,
  },
  {
    title: "Restaurants",
    icon: "chef-hat-heart-linear",
    to: "/admin/food/restaurants",
    isPro: false,
    roles: adminRoles,
  },
  {
    title: "Espace restaurant",
    icon: "shop-2-linear",
    to: "/admin/restaurant/workspace",
    isPro: false,
    roles: ["restaurant"],
  },

  { header: "Configuration", roles: adminRoles },
  {
    title: "Tarification",
    icon: "map-point-linear",
    to: "/admin/pricing/rates",
    matchPath: "/admin/pricing",
    isPro: false,
    roles: adminRoles,
  },
  {
    title: "Revenus livreurs",
    icon: "chart-linear",
    to: "/admin/revenue/drivers",
    isPro: false,
    roles: adminRoles,
  },
  {
    title: "FAQ",
    icon: "question-circle-linear",
    to: "/admin/support/faqs",
    isPro: false,
    roles: adminRoles,
  },
  {
    title: "Support",
    icon: "chat-round-dots-linear",
    to: "/admin/support/tickets",
    isPro: false,
    roles: adminRoles,
  },
  {
    title: "Types vehicule",
    icon: "delivery-linear",
    to: "/admin/vehicles/drivers",
    isPro: false,
    roles: adminRoles,
  },
  {
    title: "Parametres",
    icon: "settings-linear",
    to: "/admin/configuration/parametres",
    isPro: false,
    roles: adminRoles,
  },
];

export default sidebarItem;
export type { menu };
