
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { Button, buttonVariants } from '@/components/ui/button';
import { Settings as SettingsIcon, Download, Upload, Trash2, AlertTriangle, LayoutDashboard, CalendarDays, Database, User, Camera, PieChart, TrendingUp, KeyRound, Zap, CheckCircle, Star, Pencil, Share2, UserPlus, LogOut } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LOCAL_STORAGE_KEYS } from '@/lib/config';
import { Switch } from '@/components/ui/switch';
import type { DashboardSettings, ProgressChartTimeRange } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AvatarSelectionDialog from '@/components/settings/AvatarSelectionDialog';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from 'next/link';
import { useFriends } from '@/components/providers/FriendProvider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


// Simple hash function to get a number from a string for consistent default avatars
const simpleHash = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

const SECRET_CODE = "9818";

const BioDialog = ({ isOpen, onOpenChange, currentBio, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, currentBio: string, onSave: (newBio: string) => void }) => {
    const [bio, setBio] = useState(currentBio);

    const handleSave = () => {
        onSave(bio);
        onOpenChange(false);
    };

    useEffect(() => {
        if(isOpen) {
            setBio(currentBio);
        }
    }, [isOpen, currentBio]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit your bio</DialogTitle>
                </DialogHeader>
                <Textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others a bit about yourself..."
                    maxLength={150}
                    rows={4}
                />
                <DialogFooter>
                    <Button onClick={handleSave}>Save Bio</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function SettingsPage() {
  const { getUserLevelInfo, awardBonusPoints, masterBonusAwarded } = useUserRecords();
  const { friends, pendingRequests, incomingRequests, acceptFriendRequest, declineFriendRequest, cancelFriendRequest } = useFriends();
  const { dashboardSettings, updateDashboardSetting } = useSettings();
  const { user, userData, updateProfilePicture, updateBio, logout } = useAuth();
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isBioDialogOpen, setIsBioDialogOpen] = useState(false);
  const [secretCodeInput, setSecretCodeInput] = useState('');
  const [masterControlUnlocked, setMasterControlUnlocked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLoading, setShowLoading] = useState(true);
  
  useEffect(() => {
    // This effect ensures the loading screen is only shown on the client
    // after the initial render, preventing a hydration error.
    setShowLoading(false);
  }, []);

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';
  
  const handleExportData = () => {
    try {
      const allData: Record<string, any> = {};
      LOCAL_STORAGE_KEYS.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          allData[key] = JSON.parse(data);
        }
      });

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(allData, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `sigil_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      toast({
        title: "Export Successful",
        description: "Your data has been downloaded as a JSON file.",
      });

    } catch (error) {
      console.error("Failed to export data:", error);
      toast({
        title: "Export Failed",
        description: "Could not export your data. Check the console for errors.",
        variant: "destructive",
      });
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File could not be read.");
        }
        const importedData = JSON.parse(text);
        
        // Clear existing data first
        LOCAL_STORAGE_KEYS.forEach(key => {
            localStorage.removeItem(key);
        });

        // Import new data
        Object.keys(importedData).forEach(key => {
          if (LOCAL_STORAGE_KEYS.includes(key)) {
            localStorage.setItem(key, JSON.stringify(importedData[key]));
          }
        });

        toast({
          title: "Import Successful",
          description: "Your data has been imported. The app will now reload.",
        });

        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } catch (error) {
        console.error("Failed to import data:", error);
        toast({
          title: "Import Failed",
          description: "The file was not valid JSON or was corrupted.",
          variant: "destructive",
        });
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    setIsClearing(true);
    try {
      LOCAL_STORAGE_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });
      
      toast({
        title: "Data Cleared",
        description: "All your data has been removed. The app will now reload.",
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error("Failed to clear data:", error);
      toast({
        title: "Clear Failed",
        description: "Could not clear all data. Check the console for errors.",
        variant: "destructive",
      });
      setIsClearing(false);
    }
  };

  const dashboardComponents: { key: keyof DashboardSettings, label: string, category: 'Main' }[] = [
      { key: 'showTaskFilterBar', label: 'Task Filter Bar', category: 'Main' },
      { key: 'showContributionGraph', label: 'Contribution Graph', category: 'Main' },
      { key: 'showTodoList', label: 'Pacts Card', category: 'Main' },
      { key: 'showProgressChart', label: 'Progress Chart', category: 'Main' },
      { key: 'showTimeBreakdownChart', label: 'Daily Time Breakdown', category: 'Main' },
  ];

  const statComponents: { key: keyof DashboardSettings, label: string, hasDaysInput?: keyof DashboardSettings }[] = [
      { key: 'showTotalLast30Days', label: 'Total Value Card', hasDaysInput: 'totalDays' },
      { key: 'showCurrentStreak', label: 'Current Streak Card' },
      { key: 'showDailyConsistency', label: 'Daily Consistency Card', hasDaysInput: 'consistencyDays' },
      { key: 'showHighGoalStat', label: 'High Goal Card' },
  ];

  const handleDaysChange = (key: keyof DashboardSettings, value: string) => {
    // Allow empty string for editing, otherwise convert to number
    const numValue = value === '' ? '' : Number(value);
    
    // Only update if it's an empty string or a valid number within range
    if (numValue === '' || (typeof numValue === 'number' && numValue >= 1 && numValue <= 365)) {
        updateDashboardSetting(key, numValue as any); // Cast to any to allow empty string
    }
  };

  const handleDaysBlur = (key: keyof DashboardSettings, value: string | number) => {
    // If the input is empty or invalid on blur, reset to a default value (e.g., 30)
    if (value === '' || Number(value) <= 0) {
      updateDashboardSetting(key, 30);
    }
  };
  
  const getAvatarForId = (id: string | undefined) => {
      if (!id) return '';
      const avatarNumber = (simpleHash(id) % 12) + 1;
      return `/avatars/avatar${avatarNumber}.jpeg`;
  }

  const userAvatar = userData?.photoURL || getAvatarForId(user?.uid);

  const handleUnlockMasterControl = () => {
    if (secretCodeInput === SECRET_CODE) {
      setMasterControlUnlocked(true);
      toast({
        title: "Master Control Unlocked",
        description: "Secrets are now available.",
      });
    } else {
      toast({
        title: "Incorrect Code",
        description: "The sequence is wrong. Access denied.",
        variant: "destructive"
      });
      setSecretCodeInput('');
    }
  };

  const handleAwardBonusXp = () => {
    const bonus = 10000;
    if (masterBonusAwarded) {
        toast({ title: "Bonus Already Awarded", description: "The master bonus can only be claimed once.", variant: "destructive" });
        return;
    }
    awardBonusPoints(bonus, true); // Pass true for isMasterBonus
    toast({
      title: `✨ ${bonus.toLocaleString()} XP Awarded!`,
      description: "A surge of energy flows through you."
    });
  };

  if (showLoading) {
    return null;
  }

  return (
    <>
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
        <div className="w-full max-w-4xl mx-auto">
            <div className="p-6 md:p-0 pt-6 space-y-8">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />Profile</TabsTrigger>
                <TabsTrigger value="layout"><LayoutDashboard className="mr-2 h-4 w-4" />Layout</TabsTrigger>
                <TabsTrigger value="data"><Database className="mr-2 h-4 w-4" />Data</TabsTrigger>
              </TabsList>
              
               <TabsContent value="profile" className="mt-6">
                 {/* Desktop Layout */}
                  <div className="hidden md:grid md:grid-cols-3 md:gap-8">
                    <div className="md:col-span-1 flex justify-center md:justify-start">
                        <button
                          onClick={() => setIsAvatarDialogOpen(true)}
                          className="avatar-overlay-container rounded-full"
                          aria-label="Change profile picture"
                        >
                          <Avatar className="h-36 w-36 ring-2 ring-primary/50 ring-offset-4 ring-offset-background">
                              <AvatarImage src={userAvatar} alt={userData?.username}/>
                              <AvatarFallback className="text-5xl">
                                  {userData?.username ? userData.username.charAt(0).toUpperCase() : '?'}
                              </AvatarFallback>
                          </Avatar>
                          <div className="avatar-overlay">
                              <Pencil className="h-8 w-8 text-white/90" />
                          </div>
                        </button>
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2">
                           <h2 className="text-2xl font-light">{userData?.username}</h2>
                        </div>
                         <div className="flex items-start gap-2">
                            <p className="text-sm text-muted-foreground italic flex-grow whitespace-pre-wrap">
                                {userData?.bio || "No bio yet."}
                            </p>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsBioDialogOpen(true)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <Separator />

                        <div className="flex items-center gap-8">
                            <div>
                                <span className="font-bold">{levelInfo?.currentLevel}</span>
                                <span className="text-muted-foreground ml-1">Level</span>
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="cursor-pointer hover:underline">
                                        <span className="font-bold">{friends.length}</span>
                                        <span className="text-muted-foreground ml-1">Friends</span>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none">Friends</h4>
                                            <p className="text-sm text-muted-foreground">Your connections.</p>
                                        </div>
                                        <ScrollArea className="h-[200px]">
                                        {friends.length === 0 ? (
                                            <p className="text-center text-sm text-muted-foreground py-4">No friends yet.</p>
                                        ) : (
                                            <div className="space-y-2 pr-2">
                                                {friends.map(friend => (
                                                <Link key={friend.uid} href={`/friends/${friend.uid}`}>
                                                    <div className="p-2 border rounded-lg flex items-center gap-3 bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={friend.photoURL || getAvatarForId(friend.uid)} />
                                                        <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-sm">{friend.username}</span>
                                                    </div>
                                                </Link>
                                                ))}
                                            </div>
                                        )}
                                        </ScrollArea>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="cursor-pointer hover:underline">
                                        <span className="font-bold">{pendingRequests.length + incomingRequests.length}</span>
                                        <span className="text-muted-foreground ml-1">Pending</span>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none">Pending Requests</h4>
                                            <p className="text-sm text-muted-foreground">Manage your requests.</p>
                                        </div>
                                        <ScrollArea className="h-[200px]">
                                            <h5 className="text-xs font-semibold text-muted-foreground mb-2">INCOMING ({incomingRequests.length})</h5>
                                            {incomingRequests.length === 0 ? <p className="text-center text-xs text-muted-foreground py-2">None</p> : incomingRequests.map(req => (
                                                <div key={req.id} className="p-2 border rounded-lg flex items-center justify-between bg-card mb-2">
                                                    <span className="font-medium text-xs">{req.senderUsername}</span>
                                                    <div className="flex gap-1">
                                                        <Button size="sm" className="h-6 px-2 text-xs" onClick={() => acceptFriendRequest(req)}>Accept</Button>
                                                        <Button size="sm" variant="destructive" className="h-6 px-2 text-xs" onClick={() => declineFriendRequest(req.id)}>Decline</Button>
                                                    </div>
                                                </div>
                                            ))}
                                            <Separator className="my-2" />
                                            <h5 className="text-xs font-semibold text-muted-foreground mb-2">SENT ({pendingRequests.length})</h5>
                                            {pendingRequests.length === 0 ? <p className="text-center text-xs text-muted-foreground py-2">None</p> : pendingRequests.map(req => (
                                                <div key={req.id} className="p-2 border rounded-lg flex items-center justify-between bg-card mb-2">
                                                    <span className="font-medium text-xs">{req.recipientUsername}</span>
                                                    <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => cancelFriendRequest(req.id)}>Cancel</Button>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
                 {/* Mobile Layout */}
                <div className="md:hidden space-y-4">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setIsAvatarDialogOpen(true)}
                            className="avatar-overlay-container rounded-full flex-shrink-0"
                            aria-label="Change profile picture"
                        >
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={userAvatar} alt={userData?.username}/>
                                <AvatarFallback className="text-4xl">
                                    {userData?.username ? userData.username.charAt(0).toUpperCase() : '?'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="avatar-overlay">
                                <Pencil className="h-6 w-6 text-white/90" />
                            </div>
                        </button>
                        <div className="flex-grow flex flex-col items-start space-y-2">
                             <h2 className="font-semibold text-lg">{userData?.username}</h2>
                             <div className="flex justify-around items-center gap-4 text-center">
                                <div>
                                    <p className="font-bold text-lg">{friends.length}</p>
                                    <p className="text-sm text-muted-foreground">Friends</p>
                                </div>
                                <div>
                                    <p className="font-bold text-lg">{levelInfo?.currentLevel}</p>
                                    <p className="text-sm text-muted-foreground">Level</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                         <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {userData?.bio || "No bio yet."}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button className="flex-1" onClick={() => setIsBioDialogOpen(true)}>Edit Profile</Button>
                        <Button variant="secondary" className="flex-1">Share Profile</Button>
                    </div>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="mt-6">
                <Accordion type="multiple" className="w-full space-y-4">
                  <AccordionItem value="dashboard-components" className="border rounded-lg p-4">
                    <AccordionTrigger>Main Dashboard Components</AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-4">
                      {dashboardComponents.map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between">
                              <Label htmlFor={key.toString()} className="font-normal">{label}</Label>
                              <Switch
                                  id={key.toString()}
                                  checked={!!dashboardSettings[key]}
                                  onCheckedChange={(checked) => updateDashboardSetting(key, checked)}
                              />
                          </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="stats-panel" className="border rounded-lg p-4">
                    <AccordionTrigger>Stats Panel Cards</AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-4">
                       {statComponents.map(({ key, label, hasDaysInput }) => (
                          <div key={key} className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                  <Label htmlFor={key.toString()} className="font-normal">{label}</Label>
                                  <Switch
                                      id={key.toString()}
                                      checked={!!dashboardSettings[key]}
                                      onCheckedChange={(checked) => updateDashboardSetting(key, checked)}
                                  />
                              </div>
                              {hasDaysInput && dashboardSettings[key] && (
                                   <div className="flex items-center gap-2 pl-4 animate-fade-in-up">
                                      <CalendarDays className="h-4 w-4 text-muted-foreground"/>
                                      <Label htmlFor={`${hasDaysInput}-input`} className="text-xs text-muted-foreground whitespace-nowrap">Time Period (days)</Label>
                                      <Input
                                          id={`${hasDaysInput}-input`}
                                          type="number"
                                          className="h-8 w-20"
                                          value={dashboardSettings[hasDaysInput] as number}
                                          onChange={(e) => handleDaysChange(hasDaysInput, e.target.value)}
                                          onBlur={(e) => handleDaysBlur(hasDaysInput, e.target.value)}
                                          min={1}
                                          max={365}
                                      />
                                  </div>
                              )}
                          </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="chart-display" className="border rounded-lg p-4">
                    <AccordionTrigger>Chart Display</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div>
                          <Label className="font-normal">Progress Chart Time Range</Label>
                          <RadioGroup 
                              value={dashboardSettings.progressChartTimeRange || 'weekly'}
                              onValueChange={(value: ProgressChartTimeRange) => updateDashboardSetting('progressChartTimeRange', value)}
                              className="mt-2 grid grid-cols-2 gap-2"
                          >
                              {(['weekly', 'monthly', 'quarterly', 'biannually', 'yearly'] as ProgressChartTimeRange[]).map(range => (
                                  <div className="flex items-center space-x-2" key={range}>
                                      <RadioGroupItem value={range} id={`r-${range}`} />
                                      <Label htmlFor={`r-${range}`} className="font-normal capitalize">{range}</Label>
                                  </div>
                              ))}
                          </RadioGroup>
                      </div>
                      <Separator />
                      <div>
                          <Label className="font-normal">Time Pie Chart Labels</Label>
                          <RadioGroup 
                              value={dashboardSettings.pieChartLabelFormat || 'percentage'}
                              onValueChange={(value: 'percentage' | 'time') => updateDashboardSetting('pieChartLabelFormat', value)}
                              className="mt-2"
                          >
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="percentage" id="r-percent" />
                              <Label htmlFor="r-percent" className="font-normal">Percentage</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="time" id="r-time" />
                              <Label htmlFor="r-time" className="font-normal">Time (HH:MM)</Label>
                          </div>
                          </RadioGroup>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TabsContent>
              
              <TabsContent value="data" className="mt-6">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-primary">Data Backup & Restore</h3>
                        <div className="p-4 border rounded-lg space-y-4">
                            <p className="text-sm text-muted-foreground">Export all your data to a JSON file for backup, or import a previous backup.</p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button onClick={handleExportData} className="w-full">
                                    <Download className="mr-2 h-4 w-4"/>
                                    Export Data
                                </Button>
                                <Label htmlFor="import-file" className={cn("w-full cursor-pointer", buttonVariants())}>
                                    <Upload className="mr-2 h-4 w-4"/>
                                    Import Data
                                </Label>
                                <Input id="import-file" type="file" accept=".json" className="hidden" onChange={handleImportData} disabled={isImporting}/>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-primary">Secrets</h3>
                         <div className="p-4 border rounded-lg space-y-4">
                           {!masterControlUnlocked ? (
                             <>
                                <p className="text-sm text-muted-foreground">Enter the correct sequence to unlock master control.</p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <div className="relative flex-grow">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                      type="password"
                                      placeholder="Secret Code"
                                      className="pl-10"
                                      value={secretCodeInput}
                                      onChange={(e) => setSecretCodeInput(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleUnlockMasterControl()}
                                    />
                                  </div>
                                  <Button onClick={handleUnlockMasterControl}>Unlock</Button>
                                </div>
                             </>
                           ) : (
                             <div className="space-y-4 animate-fade-in-up">
                                <h4 className="font-semibold text-primary">Master Control Panel</h4>
                                <p className="text-sm text-muted-foreground">With great power comes great responsibility.</p>
                                <Button onClick={handleAwardBonusXp} disabled={masterBonusAwarded}>
                                  {masterBonusAwarded ? (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Bonus Awarded
                                    </>
                                  ) : (
                                    <>
                                      <Zap className="mr-2 h-4 w-4" />
                                      Award 10,000 Bonus XP
                                    </>
                                  )}
                                </Button>
                             </div>
                           )}
                         </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
                        <div className="p-4 border border-destructive/50 rounded-lg space-y-4 bg-destructive/10">
                            <p className="text-sm text-destructive/90">These actions are irreversible. Please be certain before proceeding.</p>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                  <Trash2 className="mr-2 h-4 w-4"/>
                                   Clear All Data
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete all your records, tasks, goals, achievements, and settings. This action cannot be undone. It is highly recommended to export your data first.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleClearData} disabled={isClearing} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                        {isClearing ? "Clearing..." : "Yes, delete everything"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>
              </TabsContent>
            </Tabs>
            </div>
        </div>
      </main>
    </div>
    <AvatarSelectionDialog
        isOpen={isAvatarDialogOpen}
        onOpenChange={setIsAvatarDialogOpen}
        onSelect={(url) => updateProfilePicture(url)}
        currentAvatar={userData?.photoURL}
    />
    <BioDialog
        isOpen={isBioDialogOpen}
        onOpenChange={setIsBioDialogOpen}
        currentBio={userData?.bio || ''}
        onSave={updateBio}
    />
    </>
  );
}
