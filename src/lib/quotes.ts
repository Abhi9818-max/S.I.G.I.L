
export interface Quote {
  text: string;
  author: string;
  category: string;
}

export const QUOTES: Quote[] = [
  // Motivation
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "Motivation",
  },
  {
    text: "The best way to predict the future is to create it.",
    author: "Peter Drucker",
    category: "Motivation",
  },
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    category: "Motivation",
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: "Motivation",
  },
  {
    text: "The will to win, the desire to succeed, the urge to reach your full potential... these are the keys that will unlock the door to personal excellence.",
    author: "Confucius",
    category: "Motivation",
  },
  {
    text: "Either you run the day or the day runs you.",
    author: "Jim Rohn",
    category: "Motivation",
  },
  {
    text: "The only limit to our realization of tomorrow will be our doubts of today.",
    author: "Franklin D. Roosevelt",
    category: "Motivation",
  },
  {
    text: "Do not wait to strike till the iron is hot; but make it hot by striking.",
    author: "William Butler Yeats",
    category: "Motivation",
  },
  {
    text: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    author: "Zig Ziglar",
    category: "Motivation",
  },
  {
    text: "The man who has a why to live can bear almost any how.",
    author: "Friedrich Nietzsche",
    category: "Motivation"
  },
  {
    text: "Build your own dreams, or someone else will hire you to build theirs.",
    author: "Farrah Gray",
    category: "Motivation"
  },
  {
    text: "Act as if what you do makes a difference. It does.",
    author: "William James",
    category: "Motivation"
  },
  {
    text: "Get busy living or get busy dying.",
    author: "Stephen King, The Shawshank Redemption",
    category: "Motivation"
  },
  {
    text: "You only live once, but if you do it right, once is enough.",
    author: "Mae West",
    category: "Motivation"
  },
  {
    text: "Never let the fear of striking out keep you from playing the game.",
    author: "Babe Ruth",
    category: "Motivation"
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
    category: "Motivation"
  },
  {
    text: "Eighty percent of success is showing up.",
    author: "Woody Allen",
    category: "Motivation"
  },
  {
    text: "Your talent determines what you can do. Your motivation determines how much you are willing to do. Your attitude determines how well you do it.",
    author: "Lou Holtz",
    category: "Motivation"
  },
  {
    text: "If you are working on something that you really care about, you don’t have to be pushed. The vision pulls you.",
    author: "Steve Jobs",
    category: "Motivation"
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle",
    category: "Motivation"
  },
  {
    text: "Do not go where the path may lead, go instead where there is no path and leave a trail.",
    author: "Ralph Waldo Emerson",
    category: "Motivation"
  },
  {
    text: "Life is either a daring adventure or nothing at all.",
    author: "Helen Keller",
    category: "Motivation"
  },
  {
    text: "Everything you’ve ever wanted is on the other side of fear.",
    author: "George Addair",
    category: "Motivation",
  },
  {
    text: "Don’t be pushed around by the fears in your mind. Be led by the dreams in your heart.",
    author: "Roy T. Bennett",
    category: "Motivation",
  },
  {
    text: "It's hard to beat a person who never gives up.",
    author: "Babe Ruth",
    category: "Motivation",
  },
  {
    text: "I’ve missed more than 9000 shots in my career. I’ve lost almost 300 games. 26 times I’ve been trusted to take the game winning shot and missed. I’ve failed over and over and over again in my life. And that is why I succeed.",
    author: "Michael Jordan",
    category: "Motivation",
  },
  {
    text: "If you're going through hell, keep going.",
    author: "Winston Churchill",
    category: "Motivation",
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    category: "Motivation",
  },
  {
    text: "Success usually comes to those who are too busy to be looking for it.",
    author: "Henry David Thoreau",
    category: "Motivation",
  },

  // Inspiration
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    category: "Inspiration",
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    category: "Inspiration",
  },
  {
    text: "The journey of a thousand miles begins with a single step.",
    author: "Lao Tzu",
    category: "Inspiration",
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    category: "Inspiration",
  },
  {
    text: "It does not do to dwell on dreams and forget to live.",
    author: "J.K. Rowling, Harry Potter and the Sorcerer's Stone",
    category: "Inspiration",
  },
  {
    text: "Our lives are defined by opportunities, even the ones we miss.",
    author: "F. Scott Fitzgerald",
    category: "Inspiration"
  },
  {
    text: "Hardships often prepare ordinary people for an extraordinary destiny.",
    author: "C.S. Lewis",
    category: "Inspiration",
  },
  {
    text: "Your time is limited, don't waste it living someone else's life.",
    author: "Steve Jobs",
    category: "Inspiration",
  },
  {
    text: "The only thing standing between you and your goal is the story you keep telling yourself as to why you can't achieve it.",
    author: "Jordan Belfort",
    category: "Inspiration"
  },
  {
    text: "If you are not willing to risk the usual, you will have to settle for the ordinary.",
    author: "Jim Rohn",
    category: "Inspiration"
  },
  {
    text: "The only person you are destined to become is the person you decide to be.",
    author: "Ralph Waldo Emerson",
    category: "Inspiration"
  },
  {
    text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
    author: "Ralph Waldo Emerson",
    category: "Inspiration"
  },
  {
    text: "We are all in the gutter, but some of us are looking at the stars.",
    author: "Oscar Wilde, Lady Windermere's Fan",
    category: "Inspiration"
  },
  {
    text: "Be the change that you wish to see in the world.",
    author: "Mahatma Gandhi",
    category: "Inspiration"
  },
  {
    text: "To live is the rarest thing in the world. Most people exist, that is all.",
    author: "Oscar Wilde",
    category: "Inspiration"
  },
  {
    text: "The purpose of our lives is to be happy.",
    author: "Dalai Lama",
    category: "Inspiration"
  },
  {
    text: "In the end, it's not the years in your life that count. It's the life in your years.",
    author: "Abraham Lincoln",
    category: "Inspiration"
  },
  {
    text: "Keep smiling, because life is a beautiful thing and there's so much to smile about.",
    author: "Marilyn Monroe",
    category: "Inspiration"
  },
  {
    text: "Love the life you live. Live the life you love.",
    author: "Bob Marley",
    category: "Inspiration"
  },
  {
    text: "May you live all the days of your life.",
    author: "Jonathan Swift",
    category: "Inspiration"
  },
  {
    text: "Life itself is the most wonderful fairy tale.",
    author: "Hans Christian Andersen",
    category: "Inspiration"
  },
  {
    text: "People who are crazy enough to think they can change the world, are the ones who do.",
    author: "Rob Siltanen",
    category: "Inspiration"
  },
  {
    text: "The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.",
    author: "Winston Churchill",
    category: "Inspiration"
  },
  {
    text: "Nothing is impossible, the word itself says 'I'm possible'!",
    author: "Audrey Hepburn",
    category: "Inspiration"
  },
  {
    text: "You can't use up creativity. The more you use, the more you have.",
    author: "Maya Angelou",
    category: "Inspiration",
  },
  {
    text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    author: "Ralph Waldo Emerson",
    category: "Inspiration",
  },
  {
    text: "Not all who wander are lost.",
    author: "J.R.R. Tolkien",
    category: "Inspiration",
  },

  // Fighting & Stoicism
  {
    text: "The impediment to action advances action. What stands in the way becomes the way.",
    author: "Marcus Aurelius",
    category: "Fighting",
  },
  {
    text: "We suffer more often in imagination than in reality.",
    author: "Seneca",
    category: "Fighting",
  },
  {
    text: "It's not what happens to you, but how you react to it that matters.",
    author: "Epictetus",
    category: "Fighting",
  },
  {
    text: "He who is brave is free.",
    author: "Seneca",
    category: "Fighting"
  },
  {
    text: "Float like a butterfly, sting like a bee.",
    author: "Muhammad Ali",
    category: "Fighting"
  },
  {
    text: "The best revenge is not to be like your enemy.",
    author: "Marcus Aurelius",
    category: "Fighting",
  },
  {
    text: "He who lives in harmony with himself lives in harmony with the universe.",
    author: "Marcus Aurelius",
    category: "Fighting",
  },
  {
    text: "I am the master of my fate, I am the captain of my soul.",
    author: "William Ernest Henley",
    category: "Fighting",
  },
  {
    text: "You have power over your mind - not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius",
    category: "Fighting",
  },
  {
    text: "The first rule of Fight Club is: you do not talk about Fight Club.",
    author: "Chuck Palahniuk, Fight Club",
    category: "Fighting",
  },
  {
    text: "Difficulties strengthen the mind, as labor does the body.",
    author: "Seneca",
    category: "Fighting"
  },
  {
    text: "A gem cannot be polished without friction, nor a man perfected without trials.",
    author: "Seneca",
    category: "Fighting"
  },
  {
    text: "Do not pray for an easy life, pray for the strength to endure a difficult one.",
    author: "Bruce Lee",
    category: "Fighting"
  },
  {
    text: "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'",
    author: "Muhammad Ali",
    category: "Fighting"
  },
  {
    text: "He who has a why to live for can bear almost any how.",
    author: "Friedrich Nietzsche",
    category: "Fighting",
  },
  {
    text: "The only thing that is constant is change.",
    author: "Heraclitus",
    category: "Fighting",
  },

  // Wisdom
  {
    text: "The art of being wise is the art of knowing what to overlook.",
    author: "William James",
    category: "Wisdom",
  },
  {
    text: "Knowing yourself is the beginning of all wisdom.",
    author: "Aristotle",
    category: "Wisdom",
  },
  {
    text: "The only true wisdom is in knowing you know nothing.",
    author: "Socrates",
    category: "Wisdom",
  },
  {
    text: "Waste no more time arguing about what a good man should be. Be one.",
    author: "Marcus Aurelius",
    category: "Wisdom"
  },
  {
    text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.",
    author: "Rumi",
    category: "Wisdom"
  },
  {
    text: "Never let your sense of morals prevent you from doing what is right.",
    author: "Isaac Asimov, Foundation",
    category: "Wisdom"
  },
  {
    text: "The only thing we have to fear is fear itself.",
    author: "Franklin D. Roosevelt, Inaugural Address",
    category: "Wisdom"
  },
  {
    text: "The fool doth think he is wise, but the wise man knows himself to be a fool.",
    author: "William Shakespeare, As You Like It",
    category: "Wisdom"
  },
  {
    text: "If you want to live a happy life, tie it to a goal, not to people or things.",
    author: "Albert Einstein",
    category: "Wisdom"
  },
  {
    text: "If you tell the truth, you don't have to remember anything.",
    author: "Mark Twain",
    category: "Wisdom"
  },
  {
    text: "A friend is someone who knows all about you and still loves you.",
    author: "Elbert Hubbard",
    category: "Wisdom"
  },
  {
    text: "Life is what happens when you're busy making other plans.",
    author: "John Lennon",
    category: "Wisdom"
  },
  {
    text: "The unexamined life is not worth living.",
    author: "Socrates",
    category: "Wisdom"
  },
  {
    text: "Turn your wounds into wisdom.",
    author: "Oprah Winfrey",
    category: "Wisdom"
  },
  {
    text: "Life is a long lesson in humility.",
    author: "James M. Barrie",
    category: "Wisdom"
  },
  {
    text: "In three words I can sum up everything I've learned about life: it goes on.",
    author: "Robert Frost",
    category: "Wisdom"
  },
  {
    text: "Life is really simple, but we insist on making it complicated.",
    author: "Confucius",
    category: "Wisdom"
  },
  {
    text: "The two most important days in your life are the day you are born and the day you find out why.",
    author: "Mark Twain",
    category: "Wisdom"
  },
  {
    text: "It is our choices, Harry, that show what we truly are, far more than our abilities.",
    author: "J.K. Rowling, Harry Potter and the Chamber of Secrets",
    category: "Wisdom"
  },
  {
    text: "The mind is everything. What you think you become.",
    author: "Buddha",
    category: "Wisdom"
  },
  {
    text: "Count your age by friends, not years. Count your life by smiles, not tears.",
    author: "John Lennon",
    category: "Wisdom"
  },
  {
    text: "Any fool can know. The point is to understand.",
    author: "Albert Einstein",
    category: "Wisdom"
  },
  {
    text: "It is not the man who has too little, but the man who craves more, that is poor.",
    author: "Seneca",
    category: "Wisdom"
  },
  {
    text: "You will not be punished for your anger, you will be punished by your anger.",
    author: "Buddha",
    category: "Wisdom"
  },
  {
    text: "The first principle is that you must not fool yourself and you are the easiest person to fool.",
    author: "Richard P. Feynman",
    category: "Wisdom",
  },
  {
    text: "Never attribute to malice that which is adequately explained by stupidity.",
    author: "Hanlon's Razor",
    category: "Wisdom",
  },
  {
    text: "If you want to know what a man's like, take a good look at how he treats his inferiors, not his equals.",
    author: "J.K. Rowling, The Goblet of Fire",
    category: "Wisdom",
  },
  {
    text: "The trouble with having an open mind, of course, is that people will insist on coming along and trying to put things in it.",
    author: "Terry Pratchett, Diggers",
    category: "Wisdom",
  },

  // Perseverance
  {
    text: "It's not whether you get knocked down, it's whether you get up.",
    author: "Vince Lombardi",
    category: "Perseverance",
  },
  {
    text: "Perseverance is not a long race; it is many short races one after the other.",
    author: "Walter Elliot",
    category: "Perseverance",
  },
  {
    text: "The difference between a successful person and others is not a lack of strength, not a lack of knowledge, but rather a lack in will.",
    author: "Vince Lombardi",
    category: "Perseverance",
  },
  {
    text: "A river cuts through rock, not because of its power, but because of its persistence.",
    author: "Jim Watkins",
    category: "Perseverance"
  },
  {
    text: "Energy and persistence conquer all things.",
    author: "Benjamin Franklin",
    category: "Perseverance"
  },
  {
    text: "Fall seven times, stand up eight.",
    author: "Japanese Proverb",
    category: "Perseverance"
  },
  {
    text: "I am not afraid of storms, for I am learning how to sail my ship.",
    author: "Louisa May Alcott, Little Women",
    category: "Perseverance"
  },
  {
    text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "Nelson Mandela",
    category: "Perseverance"
  },
  {
    text: "You will face many defeats in life, but never let yourself be defeated.",
    author: "Maya Angelou",
    category: "Perseverance"
  },
  {
    text: "Success is how high you bounce when you hit bottom.",
    author: "George S. Patton",
    category: "Perseverance"
  },
  {
    text: "When you reach the end of your rope, tie a knot in it and hang on.",
    author: "Franklin D. Roosevelt",
    category: "Perseverance"
  },
  {
    text: "You learn more from failure than from success. Don’t let it stop you. Failure builds character.",
    author: "Unknown",
    category: "Perseverance"
  },
  {
    text: "You may be disappointed if you fail, but you are doomed if you don't try.",
    author: "Beverly Sills",
    category: "Perseverance"
  },
  {
    text: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.",
    author: "Thomas A. Edison",
    category: "Perseverance",
  },
  {
    text: "Persistence is the twin sister of excellence. One is a matter of quality; the other, a matter of time.",
    author: "Marabel Morgan",
    category: "Perseverance",
  },

  // Literature & Banned Books
  {
    text: "If you have a book you want to read but it hasn't been written yet, then you must write it.",
    author: "Toni Morrison",
    category: "Banned Books",
  },
  {
    text: "There is more than one way to burn a book. And the world is full of people running about with lit matches.",
    author: "Ray Bradbury, Fahrenheit 451",
    category: "Banned Books",
  },
  {
    text: "The books that the world calls immoral are books that show the world its own shame.",
    author: "Oscar Wilde, The Picture of Dorian Gray",
    category: "Banned Books",
  },
  {
    text: "It's the possibility of having a dream come true that makes life interesting.",
    author: "Paulo Coelho, The Alchemist",
    category: "Banned Books"
  },
  {
    text: "All animals are equal, but some animals are more equal than others.",
    author: "George Orwell, Animal Farm",
    category: "Banned Books"
  },
  {
    text: "War is peace. Freedom is slavery. Ignorance is strength.",
    author: "George Orwell, 1984",
    category: "Banned Books",
  },
  {
    text: "It's a beautiful thing, the destruction of words.",
    author: "George Orwell, 1984",
    category: "Banned Books"
  },
  {
    text: "So it goes.",
    author: "Kurt Vonnegut, Slaughterhouse-Five",
    category: "Banned Books",
  },
  {
    text: "Don't ever tell anybody anything. If you do, you start missing everybody.",
    author: "J.D. Salinger, The Catcher in the Rye",
    category: "Banned Books",
  },
  {
    text: "Nolite te bastardes carborundorum. Don't let the bastards grind you down.",
    author: "Margaret Atwood, The Handmaid's Tale",
    category: "Banned Books",
  },
  {
    text: "Words are, in my not-so-humble opinion, our most inexhaustible source of magic.",
    author: "J.K. Rowling, Harry Potter and the Deathly Hallows",
    category: "Banned Books",
  },
  {
    text: "There is some good in this world, and it's worth fighting for.",
    author: "J.R.R. Tolkien, The Two Towers",
    category: "Banned Books",
  },
  {
    text: "And so we beat on, boats against the current, borne back ceaselessly into the past.",
    author: "F. Scott Fitzgerald, The Great Gatsby",
    category: "Banned Books",
  },
  {
    text: "‘You’re mad, bonkers, completely off your head. But I’ll tell you a secret: all the best people are.’",
    author: "Lewis Carroll, Alice in Wonderland",
    category: "Banned Books",
  },
  {
    text: "It was a pleasure to burn.",
    author: "Ray Bradbury, Fahrenheit 451",
    category: "Banned Books",
  },
  {
    text: "I wanted you to see what real courage is... It's when you know you're licked before you begin but you begin anyway.",
    author: "Harper Lee, To Kill a Mockingbird",
    category: "Banned Books",
  },
  {
    text: "And now that you don't have to be perfect, you can be good.",
    author: "John Steinbeck, East of Eden",
    category: "Banned Books",
  },
  {
    text: "There is no greater agony than bearing an untold story inside you.",
    author: "Maya Angelou, I Know Why the Caged Bird Sings",
    category: "Banned Books",
  },
  {
    text: "I took a deep breath and listened to the old brag of my heart. I am, I am, I am.",
    author: "Sylvia Plath, The Bell Jar",
    category: "Banned Books",
  },
  {
    text: "The mystery of human existence lies not in just staying alive, but in finding something to live for.",
    author: "Fyodor Dostoevsky, The Brothers Karamazov",
    category: "Literature"
  },
  {
    text: "It is a far, far better thing that I do, than I have ever done; it is a far, far better rest that I go to than I have ever known.",
    author: "Charles Dickens, A Tale of Two Cities",
    category: "Literature"
  },
  {
    text: "All that is gold does not glitter, not all those who wander are lost; the old that is strong does not wither, deep roots are not reached by the frost.",
    author: "J.R.R. Tolkien, The Fellowship of the Ring",
    category: "Literature"
  },
  {
    text: "A reader lives a thousand lives before he dies . . . The man who never reads lives only one.",
    author: "George R.R. Martin, A Dance with Dragons",
    category: "Literature",
  },
  {
    text: "Stay gold, Ponyboy. Stay gold.",
    author: "S.E. Hinton, The Outsiders",
    category: "Literature",
  },

  // Humor
  {
    text: "I can resist everything except temptation.",
    author: "Oscar Wilde",
    category: "Humor"
  },
  {
    text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
    author: "Albert Einstein",
    category: "Humor"
  },
  {
    text: "I'm not superstitious, but I am a little stitious.",
    author: "Michael Scott, The Office",
    category: "Humor",
  },
  {
    text: "I find that a duck’s opinion of me is very much influenced by whether or not I have bread.",
    author: "Mitch Hedberg",
    category: "Humor",
  },
  {
    text: "Before you criticize someone, you should walk a mile in their shoes. That way, when you criticize them, you're a mile away and you have their shoes.",
    author: "Jack Handey",
    category: "Humor",
  },
  {
    text: "I am so clever that sometimes I don't understand a single word of what I am saying.",
    author: "Oscar Wilde",
    category: "Humor",
  },
  {
    text: "I have not failed. I've just found 10,000 ways that won't work.",
    author: "Thomas A. Edison",
    category: "Humor",
  },
  {
    text: "We don't make mistakes, just happy little accidents.",
    author: "Bob Ross",
    category: "Humor",
  },
  {
    text: "Go to Heaven for the climate, Hell for the company.",
    author: "Mark Twain",
    category: "Humor",
  },
  {
    text: "The difference between stupidity and genius is that genius has its limits.",
    author: "Albert Einstein",
    category: "Humor",
  },
  {
    text: "The surest sign that intelligent life exists elsewhere in the universe is that it has never tried to contact us.",
    author: "Bill Watterson, Calvin and Hobbes",
    category: "Humor",
  },
  {
    text: "Some cause happiness wherever they go; others whenever they go.",
    author: "Oscar Wilde",
    category: "Humor",
  },
  {
    text: "Always forgive your enemies; nothing annoys them so much.",
    author: "Oscar Wilde",
    category: "Humor",
  },
  {
    text: "My opinions may have changed, but not the fact that I'm right.",
    author: "Ashleigh Brilliant",
    category: "Humor",
  },
  {
    text: "I am a man of simple tastes. I am always satisfied with the best.",
    author: "Oscar Wilde",
    category: "Humor",
  },
  {
    text: "Sarcasm is the body's natural defense against stupidity.",
    author: "Unknown",
    category: "Humor",
  },
  {
    text: "I'm sorry, I don't take orders. I barely take suggestions.",
    author: "Unknown",
    category: "Humor",
  },
];
