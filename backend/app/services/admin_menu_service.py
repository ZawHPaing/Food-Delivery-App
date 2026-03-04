from typing import List, Optional, Dict, Any
import asyncio
from ..repositories.admin_menu_repo import MenuRepository
from ..models.admin_menu_models import (
    MenuItemCreate, MenuItemUpdate, MenuItemResponse,
    MenuCreate, MenuUpdate, MenuResponse,
    CategoryCreate, CategoryResponse,
    RestaurantMenuResponse
)

class MenuService:
    
    # Category methods
    @staticmethod
    async def get_all_categories() -> List[CategoryResponse]:
        """Get all categories"""
        try:
            print("Service: Fetching all categories")
            categories = await MenuRepository.get_all_categories()
            print(f"Service: Found {len(categories)} categories")
            return [CategoryResponse(id=c["id"], name=c["name"]) for c in categories]
        except Exception as e:
            print(f"Service: Error getting all categories: {e}")
            return []
    
    @staticmethod
    async def create_category(category_data: CategoryCreate) -> Optional[CategoryResponse]:
        """Create a new category"""
        try:
            print(f"Service: Creating category with name: {category_data.name}")
            
            # Check if category already exists
            existing = await MenuRepository.get_category_by_name(category_data.name)
            if existing:
                print(f"Service: Category already exists: {existing}")
                return None
            
            # Create the category
            category = await MenuRepository.create_category({"name": category_data.name})
            
            if category:
                print(f"Service: Category created successfully: {category}")
                return CategoryResponse(id=category["id"], name=category["name"])
            
            # If category creation returned None but might have succeeded,
            # try to fetch it again
            print("Service: Category creation returned None, trying to fetch...")
            await asyncio.sleep(1)  # Wait a bit for DB to complete
            new_category = await MenuRepository.get_category_by_name(category_data.name)
            if new_category:
                print(f"Service: Found category after creation: {new_category}")
                return CategoryResponse(id=new_category["id"], name=new_category["name"])
            
            print("Service: Failed to create category")
            return None
        except Exception as e:
            print(f"Service: Error in create_category: {e}")
            return None
    
    @staticmethod
    async def delete_category(category_id: int) -> bool:
        """Delete a category"""
        try:
            print(f"Service: Deleting category {category_id}")
            
            # Check if category exists
            existing = await MenuRepository.get_category_by_id(category_id)
            if not existing:
                print(f"Service: Category {category_id} not found")
                return False
            
            result = await MenuRepository.delete_category(category_id)
            print(f"Service: Delete category {category_id}: {result}")
            return result
        except Exception as e:
            print(f"Service: Error deleting category {category_id}: {e}")
            return False
    
    # Menu methods
    @staticmethod
    async def get_restaurant_menus(restaurant_id: int) -> Optional[RestaurantMenuResponse]:
        """Get all menus for a restaurant with their items"""
        try:
            print(f"Service: Getting menus for restaurant {restaurant_id}")
            
            # Get restaurant
            restaurant = await MenuRepository.get_restaurant_by_id(restaurant_id)
            if not restaurant:
                print(f"Service: Restaurant {restaurant_id} not found")
                return None
            
            # Get menus
            menus_data = await MenuRepository.get_menus_by_restaurant(restaurant_id)
            print(f"Service: Found {len(menus_data)} menus for restaurant {restaurant_id}")
            
            menus = []
            for menu_data in menus_data:
                # Get items for this menu
                items_data = await MenuRepository.get_menu_items(menu_data["id"])
                
                items = []
                for item_data in items_data:
                    # Get categories for this item
                    categories = await MenuRepository.get_categories_for_item(item_data["id"])
                    items.append(MenuItemResponse(
                        id=item_data["id"],
                        menu_id=item_data["menu_id"],
                        name=item_data["name"],
                        description=item_data.get("description"),
                        price_cents=item_data["price_cents"],
                        is_available=item_data["is_available"],
                        image_url=item_data.get("image_url"),
                        categories=[CategoryResponse(id=c["id"], name=c["name"]) for c in categories]
                    ))
                
                menus.append(MenuResponse(
                    id=menu_data["id"],
                    restaurant_id=menu_data["restaurant_id"],
                    name=menu_data.get("name"),
                    is_active=menu_data["is_active"],
                    items=items
                ))
            
            return RestaurantMenuResponse(
                restaurant_id=restaurant_id,
                restaurant_name=restaurant["name"],
                menus=menus
            )
        except Exception as e:
            print(f"Service: Error getting restaurant menus for {restaurant_id}: {e}")
            return None
    
    @staticmethod
    async def create_menu(menu_data: MenuCreate) -> Optional[MenuResponse]:
        """Create a new menu"""
        try:
            print(f"Service: Creating menu for restaurant {menu_data.restaurant_id}")
            
            # Check if restaurant exists
            restaurant = await MenuRepository.get_restaurant_by_id(menu_data.restaurant_id)
            if not restaurant:
                print(f"Service: Restaurant {menu_data.restaurant_id} not found")
                return None
            
            menu = await MenuRepository.create_menu(menu_data.dict())
            if menu:
                print(f"Service: Menu created successfully: {menu}")
                return MenuResponse(
                    id=menu["id"],
                    restaurant_id=menu["restaurant_id"],
                    name=menu.get("name"),
                    is_active=menu["is_active"],
                    items=[]
                )
            return None
        except Exception as e:
            print(f"Service: Error creating menu: {e}")
            return None
    
    @staticmethod
    async def update_menu(menu_id: int, menu_data: MenuUpdate) -> bool:
        """Update a menu"""
        try:
            print(f"Service: Updating menu {menu_id}")
            
            # Check if menu exists
            existing = await MenuRepository.get_menu_by_id(menu_id)
            if not existing:
                print(f"Service: Menu {menu_id} not found")
                return False
            
            update_data = {k: v for k, v in menu_data.dict().items() if v is not None}
            if not update_data:
                print("Service: No data to update")
                return False
            
            result = await MenuRepository.update_menu(menu_id, update_data)
            print(f"Service: Update menu {menu_id}: {result}")
            return result
        except Exception as e:
            print(f"Service: Error updating menu {menu_id}: {e}")
            return False
    
    @staticmethod
    async def delete_menu(menu_id: int) -> bool:
        """Delete a menu"""
        try:
            print(f"Service: Deleting menu {menu_id}")
            
            # Check if menu exists
            existing = await MenuRepository.get_menu_by_id(menu_id)
            if not existing:
                print(f"Service: Menu {menu_id} not found")
                return False
            
            result = await MenuRepository.delete_menu(menu_id)
            print(f"Service: Delete menu {menu_id}: {result}")
            return result
        except Exception as e:
            print(f"Service: Error deleting menu {menu_id}: {e}")
            return False
    
    # Menu Item methods
    @staticmethod
    async def create_menu_item(menu_id: int, item_data: MenuItemCreate) -> Optional[MenuItemResponse]:
        """Create a new menu item"""
        try:
            print(f"Service: Creating menu item in menu {menu_id}")
            
            # Check if menu exists
            menu = await MenuRepository.get_menu_by_id(menu_id)
            if not menu:
                print(f"Service: Menu {menu_id} not found")
                return None
            
            # Create item
            item_dict = item_data.dict(exclude={"category_ids"})
            item_dict["menu_id"] = menu_id
            item = await MenuRepository.create_menu_item(item_dict)
            
            if item:
                print(f"Service: Menu item created: {item}")
                
                # Assign categories
                if item_data.category_ids:
                    print(f"Service: Assigning categories {item_data.category_ids} to item {item['id']}")
                    await MenuRepository.assign_categories_to_item(item["id"], item_data.category_ids)
                
                # Get categories for response
                categories = await MenuRepository.get_categories_for_item(item["id"])
                
                return MenuItemResponse(
                    id=item["id"],
                    menu_id=item["menu_id"],
                    name=item["name"],
                    description=item.get("description"),
                    price_cents=item["price_cents"],
                    is_available=item["is_available"],
                    image_url=item.get("image_url"),
                    categories=[CategoryResponse(id=c["id"], name=c["name"]) for c in categories]
                )
            return None
        except Exception as e:
            print(f"Service: Error creating menu item: {e}")
            return None
    
    @staticmethod
    async def bulk_create_menu_items(menu_id: int, items_data: List[MenuItemCreate]) -> List[MenuItemResponse]:
        """Create multiple menu items at once"""
        try:
            print(f"Service: Bulk creating {len(items_data)} menu items in menu {menu_id}")
            
            # Check if menu exists
            menu = await MenuRepository.get_menu_by_id(menu_id)
            if not menu:
                print(f"Service: Menu {menu_id} not found")
                return []
            
            # Prepare items data
            items_to_create = []
            for item_data in items_data:
                item_dict = item_data.dict(exclude={"category_ids"})
                item_dict["menu_id"] = menu_id
                items_to_create.append(item_dict)
            
            # Bulk insert items
            created_items = await MenuRepository.create_menu_items_bulk(items_to_create)
            print(f"Service: Created {len(created_items)} menu items")
            
            # Assign categories
            for i, item in enumerate(created_items):
                category_ids = items_data[i].category_ids
                if category_ids:
                    print(f"Service: Assigning categories {category_ids} to item {item['id']}")
                    await MenuRepository.assign_categories_to_item(item["id"], category_ids)
            
            # Build response
            response_items = []
            for item in created_items:
                categories = await MenuRepository.get_categories_for_item(item["id"])
                response_items.append(MenuItemResponse(
                    id=item["id"],
                    menu_id=item["menu_id"],
                    name=item["name"],
                    description=item.get("description"),
                    price_cents=item["price_cents"],
                    is_available=item["is_available"],
                    image_url=item.get("image_url"),
                    categories=[CategoryResponse(id=c["id"], name=c["name"]) for c in categories]
                ))
            
            return response_items
        except Exception as e:
            print(f"Service: Error bulk creating menu items: {e}")
            return []
    
    @staticmethod
    async def update_menu_item(item_id: int, item_data: MenuItemUpdate) -> bool:
        """Update a menu item"""
        try:
            print(f"Service: Updating menu item {item_id}")
            
            # Check if item exists
            existing = await MenuRepository.get_menu_item_by_id(item_id)
            if not existing:
                print(f"Service: Menu item {item_id} not found")
                return False
            
            update_data = {k: v for k, v in item_data.dict(exclude={"category_ids"}).items() 
                          if v is not None}
            
            success = True
            if update_data:
                print(f"Service: Updating item data: {update_data}")
                success = await MenuRepository.update_menu_item(item_id, update_data)
            
            # Update categories if provided
            if item_data.category_ids is not None:
                print(f"Service: Updating categories to {item_data.category_ids}")
                await MenuRepository.assign_categories_to_item(item_id, item_data.category_ids)
            
            print(f"Service: Update menu item {item_id}: {success}")
            return success
        except Exception as e:
            print(f"Service: Error updating menu item {item_id}: {e}")
            return False
    
    @staticmethod
    async def delete_menu_item(item_id: int) -> bool:
        """Delete a menu item"""
        try:
            print(f"Service: Deleting menu item {item_id}")
            
            # Check if item exists
            existing = await MenuRepository.get_menu_item_by_id(item_id)
            if not existing:
                print(f"Service: Menu item {item_id} not found")
                return False
            
            result = await MenuRepository.delete_menu_item(item_id)
            print(f"Service: Delete menu item {item_id}: {result}")
            return result
        except Exception as e:
            print(f"Service: Error deleting menu item {item_id}: {e}")
            return False
    
    @staticmethod
    async def toggle_item_availability(item_id: int, is_available: bool) -> bool:
        """Toggle menu item availability"""
        try:
            print(f"Service: Toggling item {item_id} availability to {is_available}")
            
            # Check if item exists
            existing = await MenuRepository.get_menu_item_by_id(item_id)
            if not existing:
                print(f"Service: Menu item {item_id} not found")
                return False
            
            result = await MenuRepository.update_menu_item(item_id, {"is_available": is_available})
            print(f"Service: Toggle item {item_id}: {result}")
            return result
        except Exception as e:
            print(f"Service: Error toggling item {item_id}: {e}")
            return False