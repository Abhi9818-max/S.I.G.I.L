
"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gem, Store, Zap, ArrowRight, PlusCircle, ShoppingCart, Tag, Coins, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { useFriends } from '@/components/providers/FriendProvider';
import type { MarketplaceListing } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SellDialog = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const { unlockedAchievements } = useUserRecords();
    const { userListings, listTitleForSale } = useFriends();
    const [selectedTitleId, setSelectedTitleId] = useState('');
    const [price, setPrice] = useState('');
    const { toast } = useToast();

    const availableTitles = ACHIEVEMENTS.filter(a => a.isTitle && unlockedAchievements.includes(a.id) && !userListings.some(l => l.itemId === a.id));

    const handleSell = async () => {
        if (!selectedTitleId || !price || Number(price) <= 0) {
            toast({ title: 'Invalid Input', description: 'Please select a title and enter a valid price.', variant: 'destructive' });
            return;
        }
        try {
            await listTitleForSale(selectedTitleId, Number(price));
            toast({ title: 'Item Listed!', description: 'Your title is now on the marketplace.' });
            onOpenChange(false);
            setSelectedTitleId('');
            setPrice('');
        } catch (error) {
            toast({ title: 'Listing Failed', description: (error as Error).message, variant: 'destructive' });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Sell a Title</DialogTitle>
                    <DialogDescription>List one of your unlocked titles on the global marketplace for others to buy.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Title to Sell</label>
                        <Select onValueChange={setSelectedTitleId} value={selectedTitleId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a title..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTitles.length > 0 ? (
                                    availableTitles.map(ach => (
                                        <SelectItem key={ach.id} value={ach.id}>{ach.name}</SelectItem>
                                    ))
                                ) : (
                                    <div className="p-4 text-sm text-center text-muted-foreground">No available titles to sell.</div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Price (Aether Shards)</label>
                        <Input 
                            type="number"
                            placeholder="e.g., 500"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            min="1"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSell} disabled={!selectedTitleId || !price || Number(price) <= 0}>List Item</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function MarketPage() {
  const { getUserLevelInfo, convertXpToShards } = useUserRecords();
  const { userData, user } = useAuth();
  const { globalListings, userListings, purchaseTitle, cancelListing } = useFriends();
  const { toast } = useToast();
  
  const [xpToConvert, setXpToConvert] = useState('');
  const [isSellDialogOpen, setIsSellDialogOpen] = useState(false);

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';
  const aetherShards = userData?.aetherShards ?? 0;
  const totalXP = levelInfo?.totalAccumulatedValue ?? 0;
  const convertibleXp = userData?.bonusPoints ?? 0;

  const handleConversion = () => {
    const amount = Number(xpToConvert);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a positive number.', variant: 'destructive' });
      return;
    }
    if (amount > convertibleXp) {
      toast({ title: 'Not Enough XP', description: `You only have ${convertibleXp.toLocaleString()} convertible XP.`, variant: 'destructive' });
      return;
    }

    try {
      convertXpToShards(amount);
      toast({ title: 'Conversion Successful', description: `You converted ${amount.toLocaleString()} XP into ${(amount / 5).toLocaleString()} Aether Shards.` });
      setXpToConvert('');
    } catch (error) {
      toast({ title: 'Conversion Failed', description: (error as Error).message, variant: 'destructive' });
    }
  };
  
  const handlePurchase = async (listing: MarketplaceListing) => {
    try {
        await purchaseTitle(listing);
        toast({ title: "Purchase Successful!", description: `You are now the owner of the "${listing.itemName}" title.` });
    } catch (error) {
        toast({ title: 'Purchase Failed', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleCancelListing = async (listingId: string) => {
      try {
        await cancelListing(listingId);
        toast({ title: "Listing Removed", description: "Your item has been returned to you." });
    } catch (error) {
        toast({ title: 'Cancellation Failed', description: (error as Error).message, variant: 'destructive' });
    }
  }

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="p-6 md:p-0">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold leading-none tracking-tight">Marketplace</h1>
            </div>
            <p className="text-muted-foreground mt-2">Exchange resources and trade titles with other users.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Your Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Gem className="h-6 w-6 text-cyan-400" />
                  <p className="text-3xl font-bold">{aetherShards.toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Aether Shards</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-yellow-400" />
                  <p className="text-3xl font-bold">{totalXP.toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">XP</p>
              </CardContent>
            </Card>
          </div>
          
           <Card className="mt-6">
            <CardHeader>
                <CardTitle>XP Converter</CardTitle>
                <CardDescription>Convert your bonus XP into Aether Shards at a rate of 5 XP to 1 Shard.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        You have <span className="font-bold text-primary">{convertibleXp.toLocaleString()}</span> convertible bonus XP.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input 
                            type="number"
                            placeholder="XP to convert"
                            value={xpToConvert}
                            onChange={(e) => setXpToConvert(e.target.value)}
                            min="1"
                            max={convertibleXp}
                        />
                        <Button onClick={handleConversion} disabled={!xpToConvert || Number(xpToConvert) <= 0}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Convert
                        </Button>
                    </div>
                    {Number(xpToConvert) > 0 && (
                        <p className="text-sm text-center text-muted-foreground">
                            You will receive: <span className="font-bold text-cyan-400">{(Math.floor(Number(xpToConvert) / 5)).toLocaleString()}</span> Aether Shards
                        </p>
                    )}
                </div>
            </CardContent>
           </Card>

           <div className="mt-8 space-y-4">
               <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-semibold">Your Listings</h2>
                    </div>
                    <Button onClick={() => setIsSellDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Sell a Title
                    </Button>
                </div>
                {userListings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">You have no items listed for sale.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userListings.map(listing => (
                            <Card key={listing.id} className="flex justify-between items-center p-4">
                                <div>
                                    <p className="font-semibold">{listing.itemName}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Coins className="h-4 w-4 text-yellow-400" /> {listing.price.toLocaleString()} Shards</p>
                                </div>
                                <Button size="sm" variant="destructive" onClick={() => handleCancelListing(listing.id)}>
                                    <X className="mr-2 h-4 w-4"/> Cancel
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
           </div>

           <div className="mt-8 space-y-4">
                <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Global Listings</h2>
                </div>
                 {globalListings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">The marketplace is currently empty.</p>
                ) : (
                   <ScrollArea className="h-[400px] pr-3">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {globalListings.map(listing => (
                            <Card key={listing.id} className="p-4">
                               <p className="font-semibold">{listing.itemName}</p>
                               <p className="text-xs text-muted-foreground mb-2">Sold by: {listing.sellerUsername}</p>
                               <p className="text-sm text-muted-foreground">{listing.itemDescription}</p>
                               <div className="flex justify-between items-center mt-3">
                                  <p className="text-md font-bold flex items-center gap-1.5"><Coins className="h-4 w-4 text-yellow-400" /> {listing.price.toLocaleString()}</p>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button disabled={listing.price > aetherShards || listing.sellerId === user?.uid}>
                                            <ShoppingCart className="mr-2 h-4 w-4"/> Purchase
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to buy the "{listing.itemName}" title for {listing.price.toLocaleString()} Aether Shards?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handlePurchase(listing)}>Confirm</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                               </div>
                            </Card>
                        ))}
                    </div>
                   </ScrollArea>
                )}
           </div>

        </div>
        <SellDialog isOpen={isSellDialogOpen} onOpenChange={setIsSellDialogOpen} />
      </main>
    </div>
  );
}
