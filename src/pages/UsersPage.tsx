import { useState, useEffect } from 'react';
import { userService, User } from '@/services/userService';
import { PageLayout } from '@/components/PageLayout';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OnlineIndicator } from '@/components/OnlineIndicator';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();

  // Fetch all users
  const fetchUsers = async (showRefreshingState = false) => {
    try {
      if (showRefreshingState) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      const [fetchedUsers, fetchedOnlineUsers] = await Promise.all([
        userService.getAllUsers(100),
        userService.getOnlineUsers(50)
      ]);
      
      setUsers(fetchedUsers);
      setOnlineUsers(fetchedOnlineUsers);
      
      if (showRefreshingState) {
        toast({
          title: 'Success',
          description: 'User data refreshed successfully.',
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [toast]);

  // Function to handle refresh button click
  const handleRefresh = () => {
    fetchUsers(true);
  };

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Function to determine if a user is online
  const isUserOnline = (userId: string) => {
    return onlineUsers.some(user => user.$id === userId);
  };
  
  // Get displayed users based on active tab
  const getDisplayedUsers = () => {
    if (activeTab === 'online') {
      return onlineUsers;
    }
    return users;
  };

  return (
    <PageLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">User Directory</h1>
        <p className="text-muted-foreground mb-8">
          Browse through all registered users of Hacker News Reimagined.
        </p>
        
        <div className="flex items-center justify-between mb-8">
          <Tabs 
            defaultValue="all" 
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList>
              <TabsTrigger value="all">
                All Users <Badge variant="outline" className="ml-2">{users.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="online">
                Online Now <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-500">{onlineUsers.length}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : getDisplayedUsers().length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              {activeTab === 'online' ? 'No users are currently online' : 'No users found'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getDisplayedUsers().map(user => (
              <Card key={user.$id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12 border border-muted">
                        <AvatarImage src={user.profile_url} alt={user.name} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      
                      <OnlineIndicator isOnline={isUserOnline(user.$id)} />
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium text-lg">{user.name}</h3>
                        <OnlineIndicator isOnline={isUserOnline(user.$id)} showBadge />
                      </div>
                      <p className="text-muted-foreground text-sm truncate max-w-[200px]">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined: {formatDate(user.created)}
                      </p>
                      
                      {currentUser && currentUser.$id === user.$id && (
                        <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-hn-orange/10 text-hn-orange rounded-full">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default UsersPage; 