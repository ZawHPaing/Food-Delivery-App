"use client";

import { useState } from 'react';
import { UtensilsCrossed, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRestaurant } from '@/context/RestaurantContext';
import { MenuItemDialog } from '@/components/restaurant/menu/MenuItemDialog';
import { DeleteMenuItemDialog } from '@/components/restaurant/menu/DeleteMenuItemDialog';
import { MenuItem } from '@/types/restaurant';

export default function Menu() {
  const { menuItems, updateMenuItemAvailability, addMenuItem, updateMenuItem, deleteMenuItem } = useRestaurant();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const handleAddNew = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDeleteClick = (item: MenuItem) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const handleSave = (item: Omit<MenuItem, 'id'> & { id?: string }) => {
    if (item.id) {
      updateMenuItem(item.id, {
        name: item.name,
        description: item.description,
        price_cents: item.price_cents,
        is_available: item.is_available,
        image_url: item.image_url,
      });
    } else {
      addMenuItem({
        name: item.name,
        description: item.description,
        price_cents: item.price_cents,
        is_available: item.is_available,
        image_url: item.image_url,
      });
    }
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      deleteMenuItem(deletingItem.id);
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <UtensilsCrossed className="h-8 w-8 text-[#ff6600]" />
            Menu Management
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage your dishes, prices, and item availability.
          </p>
        </div>
        <Button 
          onClick={handleAddNew}
          className="bg-gradient-to-r from-[#e4002b] to-[#ff6600] hover:shadow-lg transition-all border-none h-11 px-6 rounded-xl font-bold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Menu Items ({menuItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Photo</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Available</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UtensilsCrossed className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{item.name}</TableCell>
                  <TableCell className="max-w-[250px] truncate text-muted-foreground text-sm">
                    {item.description}
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatPrice(item.price_cents)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={item.is_available ? "success" : "secondary"}>
                      {item.is_available ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={item.is_available}
                        onCheckedChange={() => updateMenuItemAvailability(item.id, !item.is_available)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteClick(item)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MenuItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        item={editingItem}
      />

      <DeleteMenuItemDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        item={deletingItem}
      />
    </div>
  );
}
