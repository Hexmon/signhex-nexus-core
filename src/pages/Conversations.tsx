import { useState } from "react";
import { Search, MessageSquare, Clock, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

type Conversation = {
  id: string;
  subject: string;
  department: string;
  participant: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  status: "active" | "resolved" | "pending";
  requestId?: string;
};

type Message = {
  id: string;
  sender: string;
  role: "operator" | "department" | "system";
  content: string;
  timestamp: string;
};

const mockConversations: Conversation[] = [
  {
    id: "1",
    subject: "Black Friday Promo - Schedule Conflict",
    department: "Marketing",
    participant: "Sarah Chen",
    lastMessage: "Can we extend the display time to 8pm?",
    timestamp: "2 min ago",
    unread: 3,
    status: "active",
    requestId: "REQ-2024-089"
  },
  {
    id: "2",
    subject: "Holiday Menu Update Required",
    department: "Food & Beverage",
    participant: "Mike Johnson",
    lastMessage: "Changes approved, ready to publish",
    timestamp: "15 min ago",
    unread: 0,
    status: "resolved",
    requestId: "REQ-2024-087"
  },
  {
    id: "3",
    subject: "Emergency Alert System Test",
    department: "IT Operations",
    participant: "Admin",
    lastMessage: "System test scheduled for tomorrow at 3pm",
    timestamp: "1 hour ago",
    unread: 1,
    status: "pending",
    requestId: "REQ-2024-091"
  },
  {
    id: "4",
    subject: "Staff Training Video Upload",
    department: "HR",
    participant: "Jennifer Lopez",
    lastMessage: "File format needs to be MP4 instead of AVI",
    timestamp: "3 hours ago",
    unread: 0,
    status: "active",
    requestId: "REQ-2024-085"
  },
  {
    id: "5",
    subject: "New Product Launch Graphics",
    department: "Sales",
    participant: "David Kim",
    lastMessage: "Thanks for the quick turnaround!",
    timestamp: "Yesterday",
    unread: 0,
    status: "resolved",
    requestId: "REQ-2024-082"
  }
];

const mockMessages: Record<string, Message[]> = {
  "1": [
    {
      id: "m1",
      sender: "Sarah Chen",
      role: "department",
      content: "Hi, I submitted the Black Friday promo materials yesterday. Just noticed the current schedule ends at 5pm.",
      timestamp: "Today at 2:15 PM"
    },
    {
      id: "m2",
      sender: "Admin",
      role: "operator",
      content: "Thanks for reaching out. I can see your request REQ-2024-089. The default schedule is 9am-5pm on all lobby screens.",
      timestamp: "Today at 2:18 PM"
    },
    {
      id: "m3",
      sender: "Sarah Chen",
      role: "department",
      content: "Can we extend the display time to 8pm? Black Friday sales run until store closing at 9pm.",
      timestamp: "Today at 2:45 PM"
    },
    {
      id: "m4",
      sender: "System",
      role: "system",
      content: "Schedule modification requested: Extend display to 8:00 PM",
      timestamp: "Today at 2:45 PM"
    }
  ]
};

export default function Conversations() {
  const [search, setSearch] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0]);
  const [activeTab, setActiveTab] = useState("all");
  const [replyText, setReplyText] = useState("");

  const filteredConversations = mockConversations.filter(conv => {
    const matchesSearch = search === "" || 
      conv.subject.toLowerCase().includes(search.toLowerCase()) ||
      conv.department.toLowerCase().includes(search.toLowerCase()) ||
      conv.participant.toLowerCase().includes(search.toLowerCase());
    
    const matchesTab = activeTab === "all" || conv.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const handleSendReply = () => {
    if (replyText.trim()) {
      console.log("Sending reply:", replyText);
      setReplyText("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conversations</h1>
          <p className="text-muted-foreground mt-1">
            Manage communications with departments and operators
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Archive
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="col-span-1 p-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
                <TabsTrigger value="resolved" className="flex-1">Resolved</TabsTrigger>
              </TabsList>
            </Tabs>

            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedConversation?.id === conv.id
                        ? "bg-primary/10 border-l-2 border-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-sm line-clamp-1">{conv.subject}</h3>
                      {conv.unread > 0 && (
                        <Badge variant="destructive" className="ml-2 h-5 min-w-5 flex items-center justify-center text-xs">
                          {conv.unread}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{conv.department} • {conv.participant}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{conv.lastMessage}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {conv.timestamp}
                      </span>
                      <Badge variant={conv.status === "active" ? "default" : conv.status === "resolved" ? "secondary" : "outline"} className="text-xs">
                        {conv.status}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Card>

        {/* Conversation Thread */}
        <Card className="col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{selectedConversation.participant.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-semibold text-lg">{selectedConversation.subject}</h2>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{selectedConversation.participant}</span>
                        <span>•</span>
                        <span>{selectedConversation.department}</span>
                        {selectedConversation.requestId && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs">{selectedConversation.requestId}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={selectedConversation.status === "active" ? "default" : selectedConversation.status === "resolved" ? "secondary" : "outline"}>
                    {selectedConversation.status}
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {(mockMessages[selectedConversation.id] || []).map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "operator" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] ${msg.role === "system" ? "w-full" : ""}`}>
                        {msg.role === "system" ? (
                          <div className="bg-accent/50 border border-border rounded-lg p-3 text-center">
                            <p className="text-sm text-muted-foreground italic">{msg.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">{msg.timestamp}</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">{msg.sender}</span>
                              <Badge variant="outline" className="text-xs">
                                {msg.role}
                              </Badge>
                            </div>
                            <div
                              className={`p-3 rounded-lg ${
                                msg.role === "operator"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-accent"
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{msg.timestamp}</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="flex flex-col gap-2">
                    <Button onClick={handleSendReply} disabled={!replyText.trim()}>
                      Send
                    </Button>
                    <Button variant="outline" size="sm">
                      Attach
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
