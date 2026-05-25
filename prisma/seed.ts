import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultToneOptions = JSON.stringify([
  'Professional',
  'Casual',
  'Formal',
  'Friendly',
  'Persuasive',
  'Informative',
  'Creative',
  'Humorous',
])

const defaultLanguageOptions = JSON.stringify([
  'English',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Italian',
  'Dutch',
  'Chinese',
  'Japanese',
  'Korean',
  'Arabic',
  'Hindi',
])

// ─── Categories ───────────────────────────────────────────────────────────────

const categories = [
  {
    name: 'Article & Blog Writing',
    slug: 'article-blog-writing',
    icon: 'FileText',
    description: 'Create compelling blog posts, articles, and content',
    sortOrder: 1,
  },
  {
    name: 'Ads & Marketing',
    slug: 'ads-marketing',
    icon: 'Megaphone',
    description: 'Generate high-converting ad copy and marketing content',
    sortOrder: 2,
  },
  {
    name: 'Social Media',
    slug: 'social-media',
    icon: 'Share2',
    description: 'Create engaging social media content for all platforms',
    sortOrder: 3,
  },
  {
    name: 'Email',
    slug: 'email',
    icon: 'Mail',
    description: 'Craft professional emails that get results',
    sortOrder: 4,
  },
  {
    name: 'Website & SEO',
    slug: 'website-seo',
    icon: 'Globe',
    description: 'Optimize your website content for search engines',
    sortOrder: 5,
  },
  {
    name: 'E-Commerce',
    slug: 'e-commerce',
    icon: 'ShoppingCart',
    description: 'Write product descriptions and e-commerce content',
    sortOrder: 6,
  },
  {
    name: 'Creative Writing',
    slug: 'creative-writing',
    icon: 'Sparkles',
    description: 'Unleash your creativity with stories, lyrics, and more',
    sortOrder: 7,
  },
  {
    name: 'Business',
    slug: 'business',
    icon: 'Briefcase',
    description: 'Generate business documents and professional content',
    sortOrder: 8,
  },
  {
    name: 'Code & Development',
    slug: 'code-development',
    icon: 'Code2',
    description: 'Generate code snippets and development documentation',
    sortOrder: 9,
  },
  {
    name: 'Academic',
    slug: 'academic',
    icon: 'GraduationCap',
    description: 'Academic writing, grammar checking, and research tools',
    sortOrder: 10,
  },
  {
    name: 'Video & Audio',
    slug: 'video-audio',
    icon: 'Video',
    description: 'Create video scripts, descriptions, and audio content',
    sortOrder: 11,
  },
  {
    name: 'Other Tools',
    slug: 'other-tools',
    icon: 'Wrench',
    description: 'Miscellaneous AI-powered writing tools',
    sortOrder: 12,
  },
]

// ─── Templates ────────────────────────────────────────────────────────────────

const templates = [
  // ── Article & Blog Writing ──────────────────────────────────────────────
  {
    name: 'Blog Titles',
    slug: 'blog-titles',
    description: 'Generate catchy and SEO-friendly blog titles that attract readers',
    icon: 'Heading',
    prompt:
      'Generate {count} catchy and creative blog titles about the following topic: {topic}. The target audience is {audience}. Make the titles attention-grabbing, SEO-friendly, and relevant to the topic. Each title should be unique and compelling. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Blog Topic', type: 'text', placeholder: 'e.g., Artificial Intelligence in Healthcare', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Tech professionals, students', required: false },
      { name: 'count', label: 'Number of Titles', type: 'number', placeholder: '5', required: false },
    ]),
    outputType: 'text',
    toneOptions: defaultToneOptions,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: true,
    sortOrder: 1,
  },
  {
    name: 'Blog Section',
    slug: 'blog-section',
    description: 'Write a detailed blog section that engages your readers',
    icon: 'FileText',
    prompt:
      'Write a detailed blog section about: {section_topic}. This is part of a larger blog post about: {main_topic}. The section should be approximately {word_count} words. Include relevant examples, data points, or anecdotes where appropriate. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'section_topic', label: 'Section Topic', type: 'text', placeholder: 'e.g., Benefits of AI automation', required: true },
      { name: 'main_topic', label: 'Overall Blog Topic', type: 'text', placeholder: 'e.g., AI in Modern Business', required: true },
      { name: 'word_count', label: 'Approximate Word Count', type: 'number', placeholder: '300', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: defaultToneOptions,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 2,
  },
  {
    name: 'Blog Ideas',
    slug: 'blog-ideas',
    description: 'Get creative blog post ideas tailored to your niche',
    icon: 'Lightbulb',
    prompt:
      'Generate {count} creative and unique blog post ideas for the niche: {niche}. The target audience is {audience}. For each idea, provide a brief description of what the post would cover and why it would be engaging. Consider trending topics and evergreen content. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'niche', label: 'Blog Niche', type: 'text', placeholder: 'e.g., Digital Marketing, Fitness, Technology', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Beginners, Professionals', required: false },
      { name: 'count', label: 'Number of Ideas', type: 'number', placeholder: '10', required: false },
    ]),
    outputType: 'text',
    toneOptions: defaultToneOptions,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 3,
  },
  {
    name: 'Blog Intros',
    slug: 'blog-intros',
    description: 'Write compelling blog introductions that hook your readers',
    icon: 'BookOpen',
    prompt:
      'Write a compelling and engaging introduction for a blog post titled: {title}. The blog post is about: {topic}. The introduction should hook the reader immediately, establish relevance, and set up what the post will cover. Use a {hook_style} opening style. Length: approximately {word_count} words. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'title', label: 'Blog Post Title', type: 'text', placeholder: 'e.g., 10 Ways AI is Changing Healthcare', required: true },
      { name: 'topic', label: 'Blog Post Topic', type: 'text', placeholder: 'Brief description of the post content', required: true },
      { name: 'hook_style', label: 'Opening Style', type: 'select', placeholder: 'Question, Statistic, Story, Quote', required: false },
      { name: 'word_count', label: 'Word Count', type: 'number', placeholder: '150', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: defaultToneOptions,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 4,
  },
  {
    name: 'Blog Conclusion',
    slug: 'blog-conclusion',
    description: 'Write impactful blog conclusions that leave a lasting impression',
    icon: 'BookMarked',
    prompt:
      'Write a strong and memorable conclusion for a blog post titled: {title}. The blog post is about: {topic}. The key points covered in the post are: {key_points}. The conclusion should summarize the main takeaways, provide a call-to-action, and leave the reader with something to think about. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'title', label: 'Blog Post Title', type: 'text', placeholder: 'e.g., 10 Ways AI is Changing Healthcare', required: true },
      { name: 'topic', label: 'Blog Post Topic', type: 'text', placeholder: 'Brief description of the post content', required: true },
      { name: 'key_points', label: 'Key Points Covered', type: 'textarea', placeholder: 'List the main points from your post', required: true },
    ]),
    outputType: 'markdown',
    toneOptions: defaultToneOptions,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 5,
  },
  {
    name: 'Article Generator',
    slug: 'article-generator',
    description: 'Generate complete, well-structured articles on any topic',
    icon: 'Newspaper',
    prompt:
      'Write a comprehensive article about: {topic}. The article should be approximately {word_count} words and structured with a compelling introduction, well-organized body sections with subheadings, and a strong conclusion. Target audience: {audience}. Include relevant facts, examples, and insights. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Article Topic', type: 'text', placeholder: 'e.g., The Future of Renewable Energy', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., General public, industry professionals', required: false },
      { name: 'word_count', label: 'Approximate Word Count', type: 'number', placeholder: '1000', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: defaultToneOptions,
    languageOptions: defaultLanguageOptions,
    isPremium: true,
    isFeatured: true,
    sortOrder: 6,
  },
  {
    name: 'Content Rewriter',
    slug: 'content-rewriter',
    description: 'Rewrite existing content to make it fresh and unique',
    icon: 'RefreshCw',
    prompt:
      'Rewrite the following content while maintaining the original meaning and key information but making it fresh, unique, and more engaging: {content}. The goal is to {rewrite_goal}. Ensure the rewritten content is original and passes plagiarism checks. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'content', label: 'Content to Rewrite', type: 'textarea', placeholder: 'Paste the content you want to rewrite...', required: true },
      { name: 'rewrite_goal', label: 'Rewrite Goal', type: 'select', placeholder: 'Make it more engaging, Simplify, Expand, Change perspective', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: defaultToneOptions,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 7,
  },
  {
    name: 'Paragraph Generator',
    slug: 'paragraph-generator',
    description: 'Generate well-written paragraphs on any topic',
    icon: 'AlignLeft',
    prompt:
      'Write {count} well-structured paragraph(s) about: {topic}. Each paragraph should be focused, coherent, and approximately {word_count} words. Include supporting details and transitions. The paragraphs should flow naturally. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Paragraph Topic', type: 'text', placeholder: 'e.g., The importance of cybersecurity', required: true },
      { name: 'count', label: 'Number of Paragraphs', type: 'number', placeholder: '3', required: false },
      { name: 'word_count', label: 'Words per Paragraph', type: 'number', placeholder: '100', required: false },
    ]),
    outputType: 'text',
    toneOptions: defaultToneOptions,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 8,
  },
  {
    name: 'Summarize Text',
    slug: 'summarize-text',
    description: 'Condense long text into clear, concise summaries',
    icon: 'FileMinus',
    prompt:
      'Summarize the following text in approximately {word_count} words. Capture the main ideas and key points while removing unnecessary details: {content}. The summary should be {summary_style}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'content', label: 'Text to Summarize', type: 'textarea', placeholder: 'Paste the text you want to summarize...', required: true },
      { name: 'word_count', label: 'Summary Length (words)', type: 'number', placeholder: '100', required: false },
      { name: 'summary_style', label: 'Summary Style', type: 'select', placeholder: 'Concise, Detailed, Bullet points', required: false },
    ]),
    outputType: 'text',
    toneOptions: defaultToneOptions,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: true,
    sortOrder: 9,
  },

  // ── Ads & Marketing ─────────────────────────────────────────────────────
  {
    name: 'Facebook Ads',
    slug: 'facebook-ads',
    description: 'Create compelling Facebook ad copy that drives conversions',
    icon: 'Facebook',
    prompt:
      'Create {count} Facebook ad copy variations for: {product_service}. The target audience is {audience}. The key benefit or unique selling point is: {usp}. Each ad should include a headline, primary text, and a call-to-action. Keep the primary text under 125 characters and headlines under 40 characters for optimal display. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_service', label: 'Product/Service', type: 'text', placeholder: 'e.g., Online fitness coaching program', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Busy professionals aged 30-50', required: true },
      { name: 'usp', label: 'Key Benefit/USP', type: 'text', placeholder: 'e.g., Lose 10lbs in 30 days guaranteed', required: true },
      { name: 'count', label: 'Number of Variations', type: 'number', placeholder: '3', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Exciting', 'Urgent', 'Friendly', 'Persuasive', 'Luxurious']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: true,
    sortOrder: 10,
  },
  {
    name: 'Google Ads Headlines',
    slug: 'google-ads-headlines',
    description: 'Generate high-performing Google Ads headlines',
    icon: 'Search',
    prompt:
      'Generate {count} Google Ads headlines for: {product_service}. The target keywords are: {keywords}. Each headline must be 30 characters or less. Focus on benefits, urgency, and action-oriented language. The unique selling point is: {usp}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_service', label: 'Product/Service', type: 'text', placeholder: 'e.g., Cloud storage solution', required: true },
      { name: 'keywords', label: 'Target Keywords', type: 'text', placeholder: 'e.g., cloud storage, online backup', required: true },
      { name: 'usp', label: 'Unique Selling Point', type: 'text', placeholder: 'e.g., 50GB free storage', required: false },
      { name: 'count', label: 'Number of Headlines', type: 'number', placeholder: '10', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Urgent', 'Persuasive', 'Exciting']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 11,
  },
  {
    name: 'Google Ads Description',
    slug: 'google-ads-description',
    description: 'Create persuasive Google Ads descriptions',
    icon: 'FileText',
    prompt:
      'Generate {count} Google Ads descriptions for: {product_service}. The key features are: {features}. Each description must be 90 characters or less. Include a clear call-to-action and emphasize the main benefit: {main_benefit}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_service', label: 'Product/Service', type: 'text', placeholder: 'e.g., Cloud storage solution', required: true },
      { name: 'features', label: 'Key Features', type: 'text', placeholder: 'e.g., Auto-sync, military-grade encryption', required: true },
      { name: 'main_benefit', label: 'Main Benefit', type: 'text', placeholder: 'e.g., Access files from anywhere', required: true },
      { name: 'count', label: 'Number of Descriptions', type: 'number', placeholder: '5', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Urgent', 'Persuasive', 'Exciting']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 12,
  },
  {
    name: 'Facebook Headlines',
    slug: 'facebook-headlines',
    description: 'Create attention-grabbing headlines for Facebook ads',
    icon: 'Type',
    prompt:
      'Generate {count} attention-grabbing Facebook ad headlines for: {product_service}. The headlines should highlight: {key_message}. Each headline should be under 40 characters for optimal display. Use power words and emotional triggers. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_service', label: 'Product/Service', type: 'text', placeholder: 'e.g., Meal delivery service', required: true },
      { name: 'key_message', label: 'Key Message', type: 'text', placeholder: 'e.g., Fresh meals delivered to your door', required: true },
      { name: 'count', label: 'Number of Headlines', type: 'number', placeholder: '5', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Exciting', 'Urgent', 'Friendly', 'Persuasive']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 13,
  },
  {
    name: 'AIDA Framework',
    slug: 'aida-framework',
    description: 'Create copy using the Attention-Interest-Desire-Action framework',
    icon: 'Target',
    prompt:
      'Write marketing copy using the AIDA (Attention-Interest-Desire-Action) framework for: {product_service}. Target audience: {audience}. Key benefit: {key_benefit}. Structure the copy as follows:\n\n1. ATTENTION: Hook the reader with a compelling opening\n2. INTEREST: Build interest with facts and features\n3. DESIRE: Create desire with benefits and emotional appeal\n4. ACTION: Drive action with a strong call-to-action\n\nTone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_service', label: 'Product/Service', type: 'text', placeholder: 'e.g., AI writing assistant', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Content creators and marketers', required: true },
      { name: 'key_benefit', label: 'Key Benefit', type: 'text', placeholder: 'e.g., Write 10x faster with AI', required: true },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Persuasive', 'Exciting', 'Urgent']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: true,
    sortOrder: 14,
  },
  {
    name: 'BAB Framework',
    slug: 'bab-framework',
    description: 'Create copy using the Before-After-Bridge framework',
    icon: 'ArrowRightLeft',
    prompt:
      'Write marketing copy using the BAB (Before-After-Bridge) framework for: {product_service}. Target audience: {audience}.\n\n1. BEFORE: Describe the current pain point or problem: {pain_point}\n2. AFTER: Paint a picture of the desired outcome: {desired_outcome}\n3. BRIDGE: Show how your product/service bridges the gap\n\nTone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_service', label: 'Product/Service', type: 'text', placeholder: 'e.g., Project management tool', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Small business owners', required: true },
      { name: 'pain_point', label: 'Current Pain Point', type: 'text', placeholder: 'e.g., Disorganized tasks and missed deadlines', required: true },
      { name: 'desired_outcome', label: 'Desired Outcome', type: 'text', placeholder: 'e.g., Streamlined workflow and on-time delivery', required: true },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Persuasive', 'Empathetic', 'Confident']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 15,
  },
  {
    name: 'PPPP Framework',
    slug: 'pppp-framework',
    description: 'Create copy using the Promise-Picture-Proof-Push framework',
    icon: 'LayoutList',
    prompt:
      'Write marketing copy using the PPPP (Promise-Picture-Proof-Push) framework for: {product_service}.\n\n1. PROMISE: Make a bold promise about the result: {promise}\n2. PICTURE: Paint a vivid picture of enjoying the benefit\n3. PROOF: Provide proof that it works: {proof_points}\n4. PUSH: Push the reader to take action with urgency\n\nTarget audience: {audience}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_service', label: 'Product/Service', type: 'text', placeholder: 'e.g., Online course platform', required: true },
      { name: 'promise', label: 'Core Promise', type: 'text', placeholder: 'e.g., Launch your course in 7 days', required: true },
      { name: 'proof_points', label: 'Proof Points', type: 'text', placeholder: 'e.g., 10,000+ courses launched, 95% success rate', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Knowledge entrepreneurs', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Persuasive', 'Confident', 'Exciting']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 16,
  },
  {
    name: 'Ad Headlines',
    slug: 'ad-headlines',
    description: 'General purpose ad headline generator for any platform',
    icon: 'BadgeHeading',
    prompt:
      'Generate {count} powerful ad headlines for: {product_service}. The unique value proposition is: {value_prop}. Use a mix of styles including questions, how-to, numbers, urgency, and benefit-driven headlines. Target audience: {audience}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_service', label: 'Product/Service', type: 'text', placeholder: 'e.g., Personal finance app', required: true },
      { name: 'value_prop', label: 'Value Proposition', type: 'text', placeholder: 'e.g., Save $500/month automatically', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Young professionals', required: false },
      { name: 'count', label: 'Number of Headlines', type: 'number', placeholder: '10', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Urgent', 'Persuasive', 'Exciting', 'Humorous']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 17,
  },
  {
    name: 'LinkedIn Ad Headlines',
    slug: 'linkedin-ad-headlines',
    description: 'Create professional LinkedIn ad headlines',
    icon: 'Linkedin',
    prompt:
      'Generate {count} professional LinkedIn ad headlines for: {product_service}. The target audience is: {audience}. The key professional benefit is: {benefit}. Headlines should be professional, industry-relevant, and under 70 characters. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_service', label: 'Product/Service', type: 'text', placeholder: 'e.g., Enterprise CRM software', required: true },
      { name: 'audience', label: 'Target Professional Audience', type: 'text', placeholder: 'e.g., Sales directors, C-level executives', required: true },
      { name: 'benefit', label: 'Key Professional Benefit', type: 'text', placeholder: 'e.g., Increase sales pipeline by 40%', required: true },
      { name: 'count', label: 'Number of Headlines', type: 'number', placeholder: '5', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Professional', 'Formal', 'Confident', 'Authoritative', 'Persuasive']),
    languageOptions: defaultLanguageOptions,
    isPremium: true,
    isFeatured: false,
    sortOrder: 18,
  },
  {
    name: 'LinkedIn Ad Descriptions',
    slug: 'linkedin-ad-descriptions',
    description: 'Write professional LinkedIn ad descriptions',
    icon: 'Linkedin',
    prompt:
      'Write {count} LinkedIn ad descriptions for: {product_service}. The headline is: {headline}. Target audience: {audience}. Key features: {features}. Each description should be under 150 characters, professional, and include a clear call-to-action. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_service', label: 'Product/Service', type: 'text', placeholder: 'e.g., Enterprise CRM software', required: true },
      { name: 'headline', label: 'Ad Headline', type: 'text', placeholder: 'e.g., Transform Your Sales Process', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Sales leaders', required: false },
      { name: 'features', label: 'Key Features', type: 'text', placeholder: 'e.g., AI-powered insights, seamless integration', required: true },
      { name: 'count', label: 'Number of Descriptions', type: 'number', placeholder: '3', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Professional', 'Formal', 'Confident', 'Authoritative', 'Persuasive']),
    languageOptions: defaultLanguageOptions,
    isPremium: true,
    isFeatured: false,
    sortOrder: 19,
  },

  // ── Social Media ────────────────────────────────────────────────────────
  {
    name: 'Instagram Captions',
    slug: 'instagram-captions',
    description: 'Generate engaging Instagram captions with hashtags',
    icon: 'Camera',
    prompt:
      'Write {count} engaging Instagram captions for a post about: {topic}. Include relevant emojis and {hashtag_count} trending hashtags. The post type is: {post_type}. Make the captions scroll-stopping and encourage engagement. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Post Topic', type: 'text', placeholder: 'e.g., Summer vacation at the beach', required: true },
      { name: 'post_type', label: 'Post Type', type: 'select', placeholder: 'Photo, Carousel, Reel, Story', required: false },
      { name: 'count', label: 'Number of Captions', type: 'number', placeholder: '3', required: false },
      { name: 'hashtag_count', label: 'Number of Hashtags', type: 'number', placeholder: '10', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Casual', 'Friendly', 'Humorous', 'Inspirational', 'Trendy', 'Professional']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: true,
    sortOrder: 20,
  },
  {
    name: 'Instagram Hashtags',
    slug: 'instagram-hashtags',
    description: 'Generate relevant and trending Instagram hashtags',
    icon: 'Hash',
    prompt:
      'Generate {count} relevant Instagram hashtags for a post about: {topic}. Include a mix of high-volume, medium-volume, and niche hashtags. Organize them by category: popular, medium, niche. The account niche is: {niche}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Post Topic', type: 'text', placeholder: 'e.g., Vegan recipe, Travel photography', required: true },
      { name: 'niche', label: 'Account Niche', type: 'text', placeholder: 'e.g., Food blogger, Travel influencer', required: false },
      { name: 'count', label: 'Number of Hashtags', type: 'number', placeholder: '30', required: false },
    ]),
    outputType: 'text',
    toneOptions: null,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 21,
  },
  {
    name: 'Social Media Post (Personal)',
    slug: 'social-media-post-personal',
    description: 'Create engaging personal social media posts',
    icon: 'User',
    prompt:
      'Write a personal social media post about: {topic}. The platform is: {platform}. The post should feel authentic and relatable. Include personal insights or experiences related to: {personal_angle}. Add relevant emojis. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Post Topic', type: 'text', placeholder: 'e.g., My morning routine, Career change', required: true },
      { name: 'platform', label: 'Platform', type: 'select', placeholder: 'Instagram, Facebook, Twitter/X, LinkedIn', required: true },
      { name: 'personal_angle', label: 'Personal Angle', type: 'text', placeholder: 'e.g., What I learned, How it changed me', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Casual', 'Friendly', 'Inspirational', 'Humorous', 'Reflective']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 22,
  },
  {
    name: 'Social Media Post (Business)',
    slug: 'social-media-post-business',
    description: 'Create professional business social media posts',
    icon: 'Building2',
    prompt:
      'Write a business social media post for: {brand_name}. The post is about: {topic}. The key message is: {key_message}. Include a call-to-action: {cta}. Platform: {platform}. Add relevant emojis. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'brand_name', label: 'Brand Name', type: 'text', placeholder: 'e.g., TechCorp', required: true },
      { name: 'topic', label: 'Post Topic', type: 'text', placeholder: 'e.g., Product launch, Company milestone', required: true },
      { name: 'key_message', label: 'Key Message', type: 'text', placeholder: 'e.g., Innovation meets simplicity', required: true },
      { name: 'cta', label: 'Call-to-Action', type: 'text', placeholder: 'e.g., Visit our website, Sign up now', required: false },
      { name: 'platform', label: 'Platform', type: 'select', placeholder: 'Instagram, Facebook, Twitter/X, LinkedIn', required: true },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Confident', 'Inspirational', 'Persuasive']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 23,
  },
  {
    name: 'Twitter Tweets',
    slug: 'twitter-tweets',
    description: 'Generate tweet ideas that drive engagement',
    icon: 'Twitter',
    prompt:
      'Generate {count} engaging tweets about: {topic}. Include a mix of questions, insights, tips, and bold statements. Each tweet should be under 280 characters. Use 1-3 relevant hashtags. The goal is: {goal}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Tweet Topic', type: 'text', placeholder: 'e.g., Productivity tips, AI trends', required: true },
      { name: 'goal', label: 'Tweet Goal', type: 'select', placeholder: 'Drive engagement, Share knowledge, Build audience', required: false },
      { name: 'count', label: 'Number of Tweets', type: 'number', placeholder: '5', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Casual', 'Professional', 'Witty', 'Informative', 'Provocative', 'Humorous']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 24,
  },
  {
    name: 'TikTok Video Scripts',
    slug: 'tiktok-video-scripts',
    description: 'Write viral TikTok video scripts with hooks and CTAs',
    icon: 'Clapperboard',
    prompt:
      'Write a TikTok video script about: {topic}. The video length should be approximately {duration} seconds. Include:\n- A strong hook in the first 3 seconds\n- The main content/body\n- A call-to-action at the end\n\nVisual cues: {visual_style}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Video Topic', type: 'text', placeholder: 'e.g., 5 study hacks, Day in my life', required: true },
      { name: 'duration', label: 'Video Duration (seconds)', type: 'number', placeholder: '60', required: false },
      { name: 'visual_style', label: 'Visual Style', type: 'text', placeholder: 'e.g., Talking head, Voiceover with b-roll', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Casual', 'Energetic', 'Humorous', 'Educational', 'Trendy']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: true,
    sortOrder: 25,
  },
  {
    name: 'LinkedIn Posts',
    slug: 'linkedin-posts',
    description: 'Create professional LinkedIn posts that build authority',
    icon: 'Linkedin',
    prompt:
      'Write a LinkedIn post about: {topic}. The post should establish thought leadership and encourage professional discussion. Include: {post_format} format. Key insight: {key_insight}. End with a question to drive engagement. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Post Topic', type: 'text', placeholder: 'e.g., Future of remote work, Leadership lessons', required: true },
      { name: 'post_format', label: 'Post Format', type: 'select', placeholder: 'Story, Listicle, Contrarian take, How-to', required: false },
      { name: 'key_insight', label: 'Key Insight', type: 'text', placeholder: 'e.g., Remote work increases productivity by 23%', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Professional', 'Authoritative', 'Thought-provoking', 'Inspirational', 'Analytical']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 26,
  },

  // ── Email ───────────────────────────────────────────────────────────────
  {
    name: 'Welcome Email',
    slug: 'welcome-email',
    description: 'Create warm and engaging welcome emails for new subscribers',
    icon: 'MailWelcome',
    prompt:
      'Write a welcome email for new subscribers of: {brand_name}. The brand is about: {brand_description}. The email should: welcome them warmly, set expectations for future emails, highlight the key benefit or free resource: {free_resource}, and include a clear next step. Subject line should be included. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'brand_name', label: 'Brand Name', type: 'text', placeholder: 'e.g., GrowthHub', required: true },
      { name: 'brand_description', label: 'Brand Description', type: 'text', placeholder: 'e.g., A platform for entrepreneurs', required: true },
      { name: 'free_resource', label: 'Free Resource/Benefit', type: 'text', placeholder: 'e.g., Free ebook: 10 Growth Strategies', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Friendly', 'Professional', 'Warm', 'Exciting', 'Casual']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: true,
    sortOrder: 27,
  },
  {
    name: 'Cold Email',
    slug: 'cold-email',
    description: 'Write cold outreach emails that get responses',
    icon: 'Send',
    prompt:
      'Write a cold outreach email for: {product_service}. The target recipient is: {recipient}. The key value proposition is: {value_prop}. The email should be concise (under 150 words), personalized, and end with a clear call-to-action: {cta}. Subject line should be included and compelling. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_service', label: 'Product/Service', type: 'text', placeholder: 'e.g., SaaS analytics platform', required: true },
      { name: 'recipient', label: 'Target Recipient', type: 'text', placeholder: 'e.g., Marketing directors at mid-size companies', required: true },
      { name: 'value_prop', label: 'Value Proposition', type: 'text', placeholder: 'e.g., Reduce marketing spend by 30%', required: true },
      { name: 'cta', label: 'Call-to-Action', type: 'text', placeholder: 'e.g., Schedule a 15-min demo', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Confident', 'Respectful', 'Direct']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 28,
  },
  {
    name: 'Follow-up Email',
    slug: 'follow-up-email',
    description: 'Create follow-up email sequences that nurture leads',
    icon: 'Reply',
    prompt:
      'Write a follow-up email for: {context}. The previous email was about: {previous_email_topic}. The recipient has: {recipient_action}. This is follow-up number: {followup_number}. The goal is: {goal}. Include a subject line. Keep it concise and non-pushy. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'context', label: 'Context', type: 'text', placeholder: 'e.g., Sales outreach, Job application', required: true },
      { name: 'previous_email_topic', label: 'Previous Email Topic', type: 'text', placeholder: 'e.g., Product demo offer', required: true },
      { name: 'recipient_action', label: 'Recipient Action', type: 'select', placeholder: 'Not responded, Opened but not replied, Clicked link', required: true },
      { name: 'followup_number', label: 'Follow-up Number', type: 'number', placeholder: '2', required: false },
      { name: 'goal', label: 'Goal', type: 'text', placeholder: 'e.g., Get a meeting, Close the deal', required: true },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Friendly', 'Persistent', 'Respectful']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 29,
  },
  {
    name: 'Email Subject Lines',
    slug: 'email-subject-lines',
    description: 'Generate high-open-rate email subject lines',
    icon: 'Mail',
    prompt:
      'Generate {count} email subject lines for an email about: {email_topic}. The email type is: {email_type}. The subject lines should be compelling, create curiosity or urgency, and be under 50 characters for optimal open rates. Use a mix of styles: questions, numbers, personalization, and urgency. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'email_topic', label: 'Email Topic', type: 'text', placeholder: 'e.g., Black Friday sale, Weekly newsletter', required: true },
      { name: 'email_type', label: 'Email Type', type: 'select', placeholder: 'Newsletter, Promotional, Transactional, Follow-up', required: true },
      { name: 'count', label: 'Number of Subject Lines', type: 'number', placeholder: '10', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Urgent', 'Friendly', 'Curiosity-driven']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 30,
  },

  // ── Website & SEO ───────────────────────────────────────────────────────
  {
    name: 'Meta Description',
    slug: 'meta-description',
    description: 'Generate SEO-optimized meta descriptions for web pages',
    icon: 'SearchCode',
    prompt:
      'Generate {count} SEO-optimized meta descriptions for a page about: {page_topic}. The target keyword is: {keyword}. Each meta description should be between 150-160 characters, include the target keyword, and have a compelling call-to-action. Page type: {page_type}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'page_topic', label: 'Page Topic', type: 'text', placeholder: 'e.g., Best project management tools', required: true },
      { name: 'keyword', label: 'Target Keyword', type: 'text', placeholder: 'e.g., project management tools', required: true },
      { name: 'page_type', label: 'Page Type', type: 'select', placeholder: 'Blog post, Product page, Landing page, Homepage', required: false },
      { name: 'count', label: 'Number of Descriptions', type: 'number', placeholder: '3', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Professional', 'Informative', 'Persuasive', 'Casual']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: true,
    sortOrder: 31,
  },
  {
    name: 'Privacy Policy',
    slug: 'privacy-policy',
    description: 'Generate a comprehensive privacy policy for your website',
    icon: 'Shield',
    prompt:
      'Generate a comprehensive privacy policy for: {website_name}. The website/app is: {website_description}. It collects the following data: {data_collected}. It uses the following third-party services: {third_party_services}. Include sections for data collection, usage, cookies, third-party sharing, user rights, and contact information. Comply with GDPR and CCPA where applicable. Language: {language}.',
    fields: JSON.stringify([
      { name: 'website_name', label: 'Website/App Name', type: 'text', placeholder: 'e.g., MyApp', required: true },
      { name: 'website_description', label: 'Website Description', type: 'text', placeholder: 'e.g., An online marketplace for handmade goods', required: true },
      { name: 'data_collected', label: 'Data Collected', type: 'text', placeholder: 'e.g., Name, email, payment info, browsing data', required: true },
      { name: 'third_party_services', label: 'Third-Party Services', type: 'text', placeholder: 'e.g., Google Analytics, Stripe, Mailchimp', required: false },
    ]),
    outputType: 'html',
    toneOptions: null,
    languageOptions: defaultLanguageOptions,
    isPremium: true,
    isFeatured: false,
    sortOrder: 32,
  },
  {
    name: 'Terms and Conditions',
    slug: 'terms-and-conditions',
    description: 'Generate terms and conditions for your website or app',
    icon: 'Scale',
    prompt:
      'Generate comprehensive terms and conditions for: {website_name}. The website/app is: {website_description}. The service offered is: {service_description}. Include sections for acceptance of terms, user obligations, intellectual property, limitation of liability, termination, governing law, and contact information. Language: {language}.',
    fields: JSON.stringify([
      { name: 'website_name', label: 'Website/App Name', type: 'text', placeholder: 'e.g., MyApp', required: true },
      { name: 'website_description', label: 'Website Description', type: 'text', placeholder: 'e.g., A SaaS platform for team collaboration', required: true },
      { name: 'service_description', label: 'Service Description', type: 'text', placeholder: 'e.g., Cloud-based project management and team communication', required: true },
    ]),
    outputType: 'html',
    toneOptions: null,
    languageOptions: defaultLanguageOptions,
    isPremium: true,
    isFeatured: false,
    sortOrder: 33,
  },
  {
    name: 'FAQs',
    slug: 'faqs',
    description: 'Generate frequently asked questions with answers',
    icon: 'HelpCircle',
    prompt:
      'Generate {count} frequently asked questions with detailed answers for: {topic}. The business/product is: {business_name}. The target audience is: {audience}. Make the answers clear, concise, and helpful. Cover common concerns and objections. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'FAQ Topic', type: 'text', placeholder: 'e.g., Our subscription service', required: true },
      { name: 'business_name', label: 'Business/Product Name', type: 'text', placeholder: 'e.g., CloudStorage Pro', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., New customers, Existing users', required: false },
      { name: 'count', label: 'Number of FAQs', type: 'number', placeholder: '10', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Friendly', 'Informative', 'Casual']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 34,
  },
  {
    name: 'FAQ Answers',
    slug: 'faq-answers',
    description: 'Generate answers for specific FAQ questions',
    icon: 'MessageCircleQuestion',
    prompt:
      'Write a detailed and helpful answer for the following FAQ question: {question}. Context: The business/product is {business_name}, which is {business_description}. The answer should be clear, accurate, and address any underlying concerns the questioner might have. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'question', label: 'FAQ Question', type: 'text', placeholder: 'e.g., How do I cancel my subscription?', required: true },
      { name: 'business_name', label: 'Business/Product Name', type: 'text', placeholder: 'e.g., MyApp', required: true },
      { name: 'business_description', label: 'Business Description', type: 'text', placeholder: 'Brief description of your business', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Friendly', 'Informative', 'Casual']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 35,
  },

  // ── E-Commerce ──────────────────────────────────────────────────────────
  {
    name: 'Product Description',
    slug: 'product-description',
    description: 'Write compelling product descriptions that sell',
    icon: 'Package',
    prompt:
      'Write a compelling product description for: {product_name}. Product category: {category}. Key features: {features}. Target audience: {audience}. The description should highlight benefits over features, address customer pain points, and include a persuasive call-to-action. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_name', label: 'Product Name', type: 'text', placeholder: 'e.g., UltraComfort Memory Foam Pillow', required: true },
      { name: 'category', label: 'Product Category', type: 'text', placeholder: 'e.g., Home & Garden, Electronics', required: true },
      { name: 'features', label: 'Key Features', type: 'textarea', placeholder: 'e.g., Memory foam, Cooling gel, Hypoallergenic', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Side sleepers, People with neck pain', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Luxurious', 'Exciting', 'Persuasive']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: true,
    sortOrder: 36,
  },
  {
    name: 'Amazon Product Description',
    slug: 'amazon-product-description',
    description: 'Create Amazon-optimized product descriptions',
    icon: 'ShoppingBag',
    prompt:
      'Write an Amazon-optimized product description for: {product_name}. Category: {category}. Key features: {features}. The description should follow Amazon best practices: clear benefit-driven headline, bullet points for key features, keyword-rich content, and comply with Amazon guidelines. Include backend search terms suggestion. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_name', label: 'Product Name', type: 'text', placeholder: 'e.g., Wireless Bluetooth Earbuds Pro', required: true },
      { name: 'category', label: 'Amazon Category', type: 'text', placeholder: 'e.g., Electronics, Home & Kitchen', required: true },
      { name: 'features', label: 'Key Features', type: 'textarea', placeholder: 'e.g., Noise cancellation, 30hr battery, IPX7 waterproof', required: true },
    ]),
    outputType: 'html',
    toneOptions: JSON.stringify(['Professional', 'Persuasive', 'Exciting', 'Informative']),
    languageOptions: defaultLanguageOptions,
    isPremium: true,
    isFeatured: false,
    sortOrder: 37,
  },
  {
    name: 'Amazon Product Features',
    slug: 'amazon-product-features',
    description: 'Generate Amazon product feature bullets',
    icon: 'List',
    prompt:
      'Generate 5 Amazon product feature bullets for: {product_name}. Key features: {features}. Each bullet should start with a capital benefit statement, followed by a detailed explanation. Keep each bullet under 200 characters. Include relevant keywords naturally. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_name', label: 'Product Name', type: 'text', placeholder: 'e.g., Wireless Bluetooth Earbuds Pro', required: true },
      { name: 'features', label: 'Key Features', type: 'textarea', placeholder: 'e.g., Noise cancellation, 30hr battery, IPX7 waterproof', required: true },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Professional', 'Persuasive', 'Exciting', 'Informative']),
    languageOptions: defaultLanguageOptions,
    isPremium: true,
    isFeatured: false,
    sortOrder: 38,
  },
  {
    name: 'Product Name Generator',
    slug: 'product-name-generator',
    description: 'Generate creative and memorable product names',
    icon: 'Tag',
    prompt:
      'Generate {count} creative and memorable product name ideas for: {product_description}. The product is in the {category} category. Target market: {target_market}. The names should be: catchy, easy to remember, available as domain names, and convey the product essence. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_description', label: 'Product Description', type: 'text', placeholder: 'e.g., An AI-powered writing assistant', required: true },
      { name: 'category', label: 'Product Category', type: 'text', placeholder: 'e.g., SaaS, Consumer electronics', required: true },
      { name: 'target_market', label: 'Target Market', type: 'text', placeholder: 'e.g., Freelancers, Small businesses', required: false },
      { name: 'count', label: 'Number of Names', type: 'number', placeholder: '10', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Creative', 'Professional', 'Modern', 'Playful', 'Luxurious']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 39,
  },
  {
    name: 'Selling Product Titles',
    slug: 'selling-product-titles',
    description: 'Create product titles that drive sales',
    icon: 'BadgeDollarSign',
    prompt:
      'Create {count} high-converting product titles for: {product_description}. The product category is: {category}. Each title should include key search terms, highlight the main benefit, and be optimized for e-commerce search. Platform: {platform}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_description', label: 'Product Description', type: 'text', placeholder: 'e.g., Organic green tea with jasmine', required: true },
      { name: 'category', label: 'Product Category', type: 'text', placeholder: 'e.g., Food & Beverage', required: true },
      { name: 'platform', label: 'Platform', type: 'select', placeholder: 'Amazon, Shopify, Etsy, eBay', required: false },
      { name: 'count', label: 'Number of Titles', type: 'number', placeholder: '5', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Professional', 'Persuasive', 'Exciting', 'Informative']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 40,
  },
  {
    name: 'Product Benefits',
    slug: 'product-benefits',
    description: 'List compelling product benefits that resonate with customers',
    icon: 'ThumbsUp',
    prompt:
      'List the key benefits of: {product_name}. Product features: {features}. Target audience: {audience}. For each feature, translate it into a customer benefit using the "Feature + So What + Meaning" framework. Focus on emotional and practical benefits. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_name', label: 'Product Name', type: 'text', placeholder: 'e.g., SmartHome Hub', required: true },
      { name: 'features', label: 'Product Features', type: 'textarea', placeholder: 'e.g., Voice control, 100+ device compatibility, Auto-scheduling', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Busy families, Tech enthusiasts', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Persuasive', 'Friendly', 'Exciting']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 41,
  },
  {
    name: 'Product Comparisons',
    slug: 'product-comparisons',
    description: 'Create detailed product comparison content',
    icon: 'GitCompareArrows',
    prompt:
      'Write a detailed comparison between: {product_a} and {product_b}. Compare them on the following criteria: {comparison_criteria}. Highlight the strengths and weaknesses of each product. Provide a clear recommendation for different use cases: {use_cases}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_a', label: 'Product A', type: 'text', placeholder: 'e.g., iPhone 15 Pro', required: true },
      { name: 'product_b', label: 'Product B', type: 'text', placeholder: 'e.g., Samsung Galaxy S24', required: true },
      { name: 'comparison_criteria', label: 'Comparison Criteria', type: 'text', placeholder: 'e.g., Camera, Battery, Display, Price', required: true },
      { name: 'use_cases', label: 'Use Cases', type: 'text', placeholder: 'e.g., Photography enthusiasts, Budget buyers', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Objective', 'Informative', 'Balanced']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 42,
  },
  {
    name: 'Product Characteristics',
    slug: 'product-characteristics',
    description: 'Describe product features and characteristics in detail',
    icon: 'Settings2',
    prompt:
      'Describe the key characteristics and features of: {product_name}. Product category: {category}. Known features: {features}. Provide detailed descriptions of each characteristic, including specifications, materials, and design elements. Explain what makes each characteristic notable. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_name', label: 'Product Name', type: 'text', placeholder: 'e.g., MacBook Pro M3', required: true },
      { name: 'category', label: 'Product Category', type: 'text', placeholder: 'e.g., Laptops', required: true },
      { name: 'features', label: 'Known Features', type: 'textarea', placeholder: 'e.g., M3 chip, Liquid Retina XDR, 22hr battery', required: true },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Informative', 'Technical', 'Enthusiastic']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 43,
  },

  // ── Creative Writing ────────────────────────────────────────────────────
  {
    name: 'Creative Stories',
    slug: 'creative-stories',
    description: 'Generate creative fiction and short stories',
    icon: 'PenTool',
    prompt:
      'Write a creative short story about: {topic}. Genre: {genre}. Setting: {setting}. Main character: {character_description}. The story should be approximately {word_count} words and include vivid descriptions, engaging dialogue, and a compelling narrative arc. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Story Topic', type: 'text', placeholder: 'e.g., A discovery that changes everything', required: true },
      { name: 'genre', label: 'Genre', type: 'select', placeholder: 'Sci-Fi, Fantasy, Mystery, Romance, Horror, Literary Fiction', required: true },
      { name: 'setting', label: 'Setting', type: 'text', placeholder: 'e.g., A space station in 2150', required: false },
      { name: 'character_description', label: 'Main Character', type: 'text', placeholder: 'e.g., A retired detective with a secret', required: false },
      { name: 'word_count', label: 'Word Count', type: 'number', placeholder: '500', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Dramatic', 'Mysterious', 'Whimsical', 'Dark', 'Lighthearted', 'Suspenseful']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: true,
    sortOrder: 44,
  },
  {
    name: 'Song Lyrics',
    slug: 'song-lyrics',
    description: 'Write original song lyrics for any genre',
    icon: 'Music',
    prompt:
      'Write original song lyrics about: {topic}. Genre: {genre}. Mood: {mood}. Structure the song with: verse, chorus, verse, chorus, bridge, chorus. The theme is: {theme}. Make the lyrics rhythmic, emotive, and memorable. Include a suggested tempo and style. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Song Topic', type: 'text', placeholder: 'e.g., Finding love unexpectedly', required: true },
      { name: 'genre', label: 'Music Genre', type: 'select', placeholder: 'Pop, Rock, R&B, Country, Hip-Hop, Jazz', required: true },
      { name: 'mood', label: 'Mood', type: 'text', placeholder: 'e.g., Uplifting, Melancholic, Energetic', required: false },
      { name: 'theme', label: 'Theme', type: 'text', placeholder: 'e.g., Hope, Heartbreak, Freedom', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Emotional', 'Playful', 'Intense', 'Reflective', 'Joyful', 'Melancholic']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 45,
  },
  {
    name: 'Clickbait Titles',
    slug: 'clickbait-titles',
    description: 'Generate irresistible clickbait headlines',
    icon: 'MousePointerClick',
    prompt:
      'Generate {count} clickbait-style headlines about: {topic}. The headlines should be attention-grabbing, create curiosity gaps, and make people want to click. Use techniques like: numbers, "you wont believe", "secret", "shocking", questions, and emotional triggers. Make them shareable. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g., Weight loss, Technology, Personal finance', required: true },
      { name: 'count', label: 'Number of Titles', type: 'number', placeholder: '10', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Sensational', 'Curiosity-driven', 'Urgent', 'Playful']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 46,
  },
  {
    name: 'Brand Names',
    slug: 'brand-names',
    description: 'Generate brand name ideas for your business',
    icon: 'Crown',
    prompt:
      'Generate {count} brand name ideas for a {industry} business. The brand personality is: {personality}. The target market is: {target_market}. Names should be: memorable, easy to pronounce, available as .com domains ideally, and convey the brand essence. Avoid generic names. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g., Tech, Fashion, Food, Health', required: true },
      { name: 'personality', label: 'Brand Personality', type: 'text', placeholder: 'e.g., Bold, Minimal, Playful, Premium', required: false },
      { name: 'target_market', label: 'Target Market', type: 'text', placeholder: 'e.g., Gen Z, Professionals, Families', required: false },
      { name: 'count', label: 'Number of Names', type: 'number', placeholder: '15', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Creative', 'Modern', 'Professional', 'Playful', 'Bold']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 47,
  },
  {
    name: 'Startup Name Generator',
    slug: 'startup-name-generator',
    description: 'Generate unique startup name ideas',
    icon: 'Rocket',
    prompt:
      'Generate {count} unique startup name ideas for a {industry} startup. The startup does: {startup_description}. The naming style should be: {naming_style}. Consider: compound words, portmanteaus, foreign word inspiration, and abstract names. Each name should come with a brief explanation of why it works. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g., FinTech, EdTech, HealthTech', required: true },
      { name: 'startup_description', label: 'Startup Description', type: 'text', placeholder: 'e.g., AI-powered personal finance for Gen Z', required: true },
      { name: 'naming_style', label: 'Naming Style', type: 'select', placeholder: 'Tech-y (ending in -ify, -ly), Abstract, Descriptive, Playful', required: false },
      { name: 'count', label: 'Number of Names', type: 'number', placeholder: '10', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Creative', 'Modern', 'Bold', 'Innovative']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 48,
  },
  {
    name: 'Newsletter Generator',
    slug: 'newsletter-generator',
    description: 'Generate engaging newsletter content',
    icon: 'MailOpen',
    prompt:
      'Write a newsletter for: {brand_name}. The newsletter topic is: {topic}. The audience is: {audience}. Include: a compelling subject line, personal greeting, main content section, a valuable insight or tip, and a call-to-action. The newsletter should feel personal and valuable, not salesy. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'brand_name', label: 'Brand Name', type: 'text', placeholder: 'e.g., The Daily Innovator', required: true },
      { name: 'topic', label: 'Newsletter Topic', type: 'text', placeholder: 'e.g., AI trends for 2025', required: true },
      { name: 'audience', label: 'Audience', type: 'text', placeholder: 'e.g., Tech professionals, Entrepreneurs', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Friendly', 'Professional', 'Casual', 'Informative', 'Conversational']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 49,
  },

  // ── Business ────────────────────────────────────────────────────────────
  {
    name: 'Business Ideas',
    slug: 'business-ideas',
    description: 'Generate innovative business ideas based on your interests',
    icon: 'Lightbulb',
    prompt:
      'Generate {count} innovative business ideas in the {industry} industry. Budget range: {budget}. My skills and experience: {skills}. For each idea, include: business name suggestion, brief description, target market, revenue model, and initial steps to get started. Focus on ideas with low barriers to entry. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g., Technology, Food, Education', required: true },
      { name: 'budget', label: 'Budget Range', type: 'text', placeholder: 'e.g., Under $1000, $1000-$10000', required: false },
      { name: 'skills', label: 'Your Skills/Experience', type: 'text', placeholder: 'e.g., Web development, Marketing, Cooking', required: false },
      { name: 'count', label: 'Number of Ideas', type: 'number', placeholder: '5', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Creative', 'Inspiring', 'Practical']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: true,
    sortOrder: 50,
  },
  {
    name: 'Company Bio',
    slug: 'company-bio',
    description: 'Write professional company biographies',
    icon: 'Building',
    prompt:
      'Write a professional company bio for: {company_name}. The company is in the {industry} industry. Key facts: {key_facts}. Mission: {mission}. The bio should be {length} and suitable for: {purpose}. Highlight the company achievements, values, and unique market position. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'company_name', label: 'Company Name', type: 'text', placeholder: 'e.g., TechVision Inc.', required: true },
      { name: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g., Software, Healthcare, Finance', required: true },
      { name: 'key_facts', label: 'Key Facts', type: 'textarea', placeholder: 'e.g., Founded 2020, 50 employees, $5M revenue', required: true },
      { name: 'mission', label: 'Company Mission', type: 'text', placeholder: 'e.g., Making AI accessible to everyone', required: false },
      { name: 'length', label: 'Bio Length', type: 'select', placeholder: 'Short (1 paragraph), Medium (2-3 paragraphs), Long (full page)', required: false },
      { name: 'purpose', label: 'Purpose', type: 'select', placeholder: 'Website About page, Investor deck, Social media', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Confident', 'Inspirational', 'Authoritative']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 51,
  },
  {
    name: 'Company Press Release',
    slug: 'company-press-release',
    description: 'Write professional company press releases',
    icon: 'Newspaper',
    prompt:
      'Write a professional press release for: {company_name}. The announcement is: {announcement}. Key details: {details}. Quote from: {spokesperson} (their title: {spokesperson_title}). Distribution date: {date}. Include a compelling headline, dateline, body, quote, and boilerplate. Follow standard press release format. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'company_name', label: 'Company Name', type: 'text', placeholder: 'e.g., TechVision Inc.', required: true },
      { name: 'announcement', label: 'Announcement', type: 'text', placeholder: 'e.g., Series A funding of $10M', required: true },
      { name: 'details', label: 'Key Details', type: 'textarea', placeholder: 'e.g., Led by Sequoia Capital, will expand to 3 new markets', required: true },
      { name: 'spokesperson', label: 'Spokesperson Name', type: 'text', placeholder: 'e.g., Jane Smith', required: false },
      { name: 'spokesperson_title', label: 'Spokesperson Title', type: 'text', placeholder: 'e.g., CEO', required: false },
      { name: 'date', label: 'Distribution Date', type: 'text', placeholder: 'e.g., March 1, 2025', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Formal', 'Exciting', 'Authoritative']),
    languageOptions: defaultLanguageOptions,
    isPremium: true,
    isFeatured: false,
    sortOrder: 52,
  },
  {
    name: 'Brand/Product Press Release',
    slug: 'brand-product-press-release',
    description: 'Write press releases for brand or product launches',
    icon: 'Rss',
    prompt:
      'Write a press release for a product/brand launch. Product/Brand: {product_name}. Company: {company_name}. The product: {product_description}. Key differentiators: {differentiators}. Target market: {target_market}. Availability: {availability}. Include standard press release format with headline, dateline, body, and boilerplate. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_name', label: 'Product/Brand Name', type: 'text', placeholder: 'e.g., CloudSync Pro', required: true },
      { name: 'company_name', label: 'Company Name', type: 'text', placeholder: 'e.g., TechVision Inc.', required: true },
      { name: 'product_description', label: 'Product Description', type: 'textarea', placeholder: 'e.g., AI-powered cloud synchronization tool', required: true },
      { name: 'differentiators', label: 'Key Differentiators', type: 'text', placeholder: 'e.g., 10x faster, 50% cheaper', required: true },
      { name: 'target_market', label: 'Target Market', type: 'text', placeholder: 'e.g., Enterprise businesses', required: false },
      { name: 'availability', label: 'Availability', type: 'text', placeholder: 'e.g., Available Q2 2025', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Exciting', 'Authoritative', 'Innovative']),
    languageOptions: defaultLanguageOptions,
    isPremium: true,
    isFeatured: false,
    sortOrder: 53,
  },
  {
    name: 'Problem-Agitate-Solution',
    slug: 'problem-agitate-solution',
    description: 'Create PAS framework marketing copy',
    icon: 'TriangleAlert',
    prompt:
      'Write marketing copy using the PAS (Problem-Agitate-Solution) framework for: {product_service}. Target audience: {audience}.\n\n1. PROBLEM: Identify the main problem: {problem}\n2. AGITATE: Agitate the problem by exploring its consequences and emotional impact\n3. SOLUTION: Present your product/service as the solution with clear benefits\n\nTone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_service', label: 'Product/Service', type: 'text', placeholder: 'e.g., Meal prep delivery service', required: true },
      { name: 'audience', label: 'Target Audience', type: 'text', placeholder: 'e.g., Busy professionals', required: true },
      { name: 'problem', label: 'Core Problem', type: 'text', placeholder: 'e.g., No time to cook healthy meals', required: true },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Empathetic', 'Persuasive', 'Urgent', 'Confident']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: true,
    sortOrder: 54,
  },
  {
    name: 'Testimonials/Reviews',
    slug: 'testimonials-reviews',
    description: 'Generate realistic customer testimonials and reviews',
    icon: 'Star',
    prompt:
      'Generate {count} realistic customer testimonials/reviews for: {product_service}. Product features: {features}. Customer persona: {customer_persona}. Each testimonial should sound authentic, mention specific benefits, and include a mix of emotional and practical feedback. Vary the length and detail. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'product_service', label: 'Product/Service', type: 'text', placeholder: 'e.g., Project management software', required: true },
      { name: 'features', label: 'Key Features/Benefits', type: 'text', placeholder: 'e.g., Easy collaboration, Time tracking, Integrations', required: true },
      { name: 'customer_persona', label: 'Customer Persona', type: 'text', placeholder: 'e.g., Startup founder, Marketing manager', required: false },
      { name: 'count', label: 'Number of Testimonials', type: 'number', placeholder: '5', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Enthusiastic', 'Professional', 'Grateful', 'Casual', 'Convinced']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 55,
  },
  {
    name: 'Pros & Cons',
    slug: 'pros-cons',
    description: 'List pros and cons for any topic or product',
    icon: 'Scale',
    prompt:
      'List the pros and cons of: {topic}. Consider the following aspects: {aspects}. Provide a balanced view with {items_per_side} items per side. Each point should be specific and well-explained. Include a brief conclusion or recommendation. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g., Working remotely, Electric cars, React vs Vue', required: true },
      { name: 'aspects', label: 'Aspects to Consider', type: 'text', placeholder: 'e.g., Cost, Convenience, Health, Career growth', required: false },
      { name: 'items_per_side', label: 'Items Per Side', type: 'number', placeholder: '5', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Objective', 'Balanced', 'Informative']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 56,
  },
  {
    name: 'Talking Points',
    slug: 'talking-points',
    description: 'Generate key talking points for presentations or meetings',
    icon: 'MessageSquare',
    prompt:
      'Generate key talking points for: {topic}. The context is: {context}. The audience is: {audience}. Provide {count} talking points, each with a main idea and supporting details. Organize them in a logical flow. Include potential questions the audience might ask. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g., Q4 results, Product roadmap', required: true },
      { name: 'context', label: 'Context', type: 'text', placeholder: 'e.g., Board meeting, Team all-hands', required: true },
      { name: 'audience', label: 'Audience', type: 'text', placeholder: 'e.g., Executives, Team members, Investors', required: false },
      { name: 'count', label: 'Number of Points', type: 'number', placeholder: '5', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Confident', 'Persuasive', 'Informative', 'Authoritative']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 57,
  },

  // ── Academic ────────────────────────────────────────────────────────────
  {
    name: 'Academic Essay',
    slug: 'academic-essay',
    description: 'Generate well-structured academic essays',
    icon: 'GraduationCap',
    prompt:
      'Write an academic essay on: {topic}. The essay type is: {essay_type}. The academic level is: {academic_level}. Required length: approximately {word_count} words. Include: an introduction with thesis statement, body paragraphs with evidence and analysis, counterarguments where appropriate, and a conclusion. Use academic language and proper citations where relevant. Citation style: {citation_style}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Essay Topic', type: 'text', placeholder: 'e.g., The impact of social media on democracy', required: true },
      { name: 'essay_type', label: 'Essay Type', type: 'select', placeholder: 'Argumentative, Expository, Analytical, Persuasive', required: true },
      { name: 'academic_level', label: 'Academic Level', type: 'select', placeholder: 'High school, Undergraduate, Graduate, PhD', required: false },
      { name: 'word_count', label: 'Word Count', type: 'number', placeholder: '1500', required: false },
      { name: 'citation_style', label: 'Citation Style', type: 'select', placeholder: 'APA, MLA, Chicago, Harvard', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Formal', 'Academic', 'Analytical', 'Objective']),
    languageOptions: defaultLanguageOptions,
    isPremium: true,
    isFeatured: true,
    sortOrder: 58,
  },
  {
    name: 'Grammar Checker',
    slug: 'grammar-checker',
    description: 'Check and correct grammar, spelling, and punctuation',
    icon: 'SpellCheck',
    prompt:
      'Check the following text for grammar, spelling, punctuation, and style errors. Provide the corrected version with explanations for each change made: {content}. Also suggest improvements for clarity, conciseness, and readability. Language: {language}.',
    fields: JSON.stringify([
      { name: 'content', label: 'Text to Check', type: 'textarea', placeholder: 'Paste the text you want to check for grammar errors...', required: true },
    ]),
    outputType: 'markdown',
    toneOptions: null,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: true,
    sortOrder: 59,
  },
  {
    name: 'Summarize for 2nd Grader',
    slug: 'summarize-for-2nd-grader',
    description: 'Simplify complex text so a child can understand it',
    icon: 'Baby',
    prompt:
      'Simplify the following text so that a 2nd grader (7-8 years old) can easily understand it. Use simple words, short sentences, and relatable examples: {content}. Explain any difficult concepts using everyday analogies. Language: {language}.',
    fields: JSON.stringify([
      { name: 'content', label: 'Text to Simplify', type: 'textarea', placeholder: 'Paste the complex text you want simplified...', required: true },
    ]),
    outputType: 'text',
    toneOptions: null,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 60,
  },
  {
    name: 'Dictionary',
    slug: 'dictionary',
    description: 'Define words with simple, clear explanations',
    icon: 'BookOpen',
    prompt:
      'Define the following word: {word}. Provide: 1) A simple definition, 2) A more detailed definition, 3) Part of speech, 4) Etymology (word origin), 5) Example sentences, 6) Synonyms, 7) Antonyms, 8) Related words. Language: {language}.',
    fields: JSON.stringify([
      { name: 'word', label: 'Word to Define', type: 'text', placeholder: 'e.g., Serendipity', required: true },
    ]),
    outputType: 'markdown',
    toneOptions: null,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 61,
  },

  // ── Video & Audio ───────────────────────────────────────────────────────
  {
    name: 'Video Descriptions',
    slug: 'video-descriptions',
    description: 'Write SEO-optimized YouTube video descriptions',
    icon: 'FileVideo',
    prompt:
      'Write an SEO-optimized YouTube video description for a video about: {video_topic}. Include: an attention-grabbing first 2 lines (visible before "Show More"), a detailed description, timestamps for key sections: {sections}, relevant links placeholder, and a call-to-action. Target keywords: {keywords}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'video_topic', label: 'Video Topic', type: 'text', placeholder: 'e.g., How to start a podcast in 2025', required: true },
      { name: 'sections', label: 'Video Sections/Chapters', type: 'textarea', placeholder: 'e.g., Intro, Equipment, Recording, Editing, Publishing', required: false },
      { name: 'keywords', label: 'Target Keywords', type: 'text', placeholder: 'e.g., podcast tutorial, start a podcast', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Energetic', 'Informative', 'Friendly']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: true,
    sortOrder: 62,
  },
  {
    name: 'Video Titles',
    slug: 'video-titles',
    description: 'Generate clickable and SEO-friendly video titles',
    icon: 'Clapperboard',
    prompt:
      'Generate {count} clickable and SEO-friendly video titles for a video about: {video_topic}. The titles should: be under 60 characters for optimal display, include target keywords: {keywords}, create curiosity or promise value, and follow proven YouTube title formulas. Platform: {platform}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'video_topic', label: 'Video Topic', type: 'text', placeholder: 'e.g., Python tutorial for beginners', required: true },
      { name: 'keywords', label: 'Target Keywords', type: 'text', placeholder: 'e.g., python, tutorial, beginners', required: false },
      { name: 'platform', label: 'Platform', type: 'select', placeholder: 'YouTube, TikTok, Instagram Reels', required: false },
      { name: 'count', label: 'Number of Titles', type: 'number', placeholder: '10', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Exciting', 'Curiosity-driven', 'Clickbait']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 63,
  },
  {
    name: 'Video Scripts',
    slug: 'video-scripts',
    description: 'Write professional video scripts for any platform',
    icon: 'ScrollText',
    prompt:
      'Write a video script about: {topic}. The video length should be approximately {duration} minutes. Video type: {video_type}. Include: hook/opening, main content sections, transitions, visual cues in [brackets], and a closing with call-to-action. Target platform: {platform}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'topic', label: 'Video Topic', type: 'text', placeholder: 'e.g., 5 productivity hacks you need to try', required: true },
      { name: 'duration', label: 'Video Duration (minutes)', type: 'number', placeholder: '10', required: false },
      { name: 'video_type', label: 'Video Type', type: 'select', placeholder: 'Tutorial, Review, Vlog, Explainer, Short-form', required: true },
      { name: 'platform', label: 'Platform', type: 'select', placeholder: 'YouTube, TikTok, Instagram, LinkedIn', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Casual', 'Energetic', 'Educational', 'Entertaining']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 64,
  },
  {
    name: 'YouTube Tags Generator',
    slug: 'youtube-tags-generator',
    description: 'Generate SEO-optimized YouTube tags for better discoverability',
    icon: 'Tags',
    prompt:
      'Generate {count} SEO-optimized YouTube tags for a video about: {video_topic}. Include a mix of: broad tags, specific long-tail tags, and trending tags. The target keywords are: {keywords}. Tags should follow YouTube best practices (500 character limit total). Organize by priority. Language: {language}.',
    fields: JSON.stringify([
      { name: 'video_topic', label: 'Video Topic', type: 'text', placeholder: 'e.g., Machine learning tutorial', required: true },
      { name: 'keywords', label: 'Target Keywords', type: 'text', placeholder: 'e.g., machine learning, AI, python', required: false },
      { name: 'count', label: 'Number of Tags', type: 'number', placeholder: '30', required: false },
    ]),
    outputType: 'text',
    toneOptions: null,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 65,
  },

  // ── Other Tools ─────────────────────────────────────────────────────────
  {
    name: 'Text Extender',
    slug: 'text-extender',
    description: 'Expand short text into longer, more detailed content',
    icon: 'Expand',
    prompt:
      'Expand the following short text into a more detailed and comprehensive version: {content}. The expanded text should be approximately {target_length} words. Add relevant details, examples, explanations, and supporting arguments while maintaining the original message and intent. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'content', label: 'Short Text to Expand', type: 'textarea', placeholder: 'Paste the short text you want to expand...', required: true },
      { name: 'target_length', label: 'Target Word Count', type: 'number', placeholder: '500', required: false },
    ]),
    outputType: 'markdown',
    toneOptions: defaultToneOptions,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 66,
  },
  {
    name: 'Rewrite with Keywords',
    slug: 'rewrite-with-keywords',
    description: 'Rewrite content to be SEO-optimized with target keywords',
    icon: 'Search',
    prompt:
      'Rewrite the following content to naturally incorporate these target keywords: {keywords}. Original content: {content}. The rewritten content should: maintain the original meaning, include keywords naturally (not forced), maintain good readability, and be optimized for search engines. Keyword density should be around 1-2%. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'content', label: 'Content to Rewrite', type: 'textarea', placeholder: 'Paste the content you want to SEO-optimize...', required: true },
      { name: 'keywords', label: 'Target Keywords', type: 'text', placeholder: 'e.g., project management, team collaboration, productivity', required: true },
    ]),
    outputType: 'markdown',
    toneOptions: JSON.stringify(['Professional', 'Informative', 'Persuasive', 'Casual']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 67,
  },
  {
    name: 'Tone Changer',
    slug: 'tone-changer',
    description: 'Change the tone of your text while keeping the meaning',
    icon: 'Palette',
    prompt:
      'Change the tone of the following text to: {target_tone}. Original text: {content}. The rewritten text should maintain the same core message and information but express it in the target tone. Adjust word choice, sentence structure, and style accordingly. Language: {language}.',
    fields: JSON.stringify([
      { name: 'content', label: 'Text to Change', type: 'textarea', placeholder: 'Paste the text whose tone you want to change...', required: true },
      { name: 'target_tone', label: 'Target Tone', type: 'select', placeholder: 'Professional, Casual, Formal, Friendly, Persuasive, Humorous, Urgent, Empathetic', required: true },
    ]),
    outputType: 'text',
    toneOptions: null,
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 68,
  },
  {
    name: 'App and SMS Notifications',
    slug: 'app-sms-notifications',
    description: 'Write push notification and SMS copy that gets clicks',
    icon: 'Bell',
    prompt:
      'Write {count} push notification/SMS messages for: {app_brand}. The notification is about: {notification_topic}. The goal is: {goal}. Each message should be under 100 characters for push notifications (160 for SMS), create urgency or curiosity, and include a clear value proposition. Platform: {platform}. Tone: {tone}. Language: {language}.',
    fields: JSON.stringify([
      { name: 'app_brand', label: 'App/Brand Name', type: 'text', placeholder: 'e.g., FitTrack', required: true },
      { name: 'notification_topic', label: 'Notification Topic', type: 'text', placeholder: 'e.g., New workout plan available', required: true },
      { name: 'goal', label: 'Goal', type: 'select', placeholder: 'Drive app opens, Increase engagement, Promote feature, Re-engage users', required: true },
      { name: 'platform', label: 'Platform', type: 'select', placeholder: 'Push Notification, SMS, In-App Message', required: false },
      { name: 'count', label: 'Number of Messages', type: 'number', placeholder: '5', required: false },
    ]),
    outputType: 'text',
    toneOptions: JSON.stringify(['Casual', 'Urgent', 'Friendly', 'Exciting', 'Professional']),
    languageOptions: defaultLanguageOptions,
    isPremium: false,
    isFeatured: false,
    sortOrder: 69,
  },
]

// ─── Pricing Plans ────────────────────────────────────────────────────────────

const pricingPlans = [
  {
    name: 'Free',
    slug: 'free',
    description: 'Get started with AI-powered content generation',
    price: 0,
    currency: 'USD',
    interval: 'monthly',
    wordsLimit: 5000,
    imagesLimit: 10,
    chatMessagesLimit: 20,
    codeLimit: 5,
    audioMinutesLimit: 2,
    features: JSON.stringify([
      '5,000 words per month',
      '10 images per month',
      '20 chat messages',
      '5 code generations',
      '2 minutes of speech',
      'Limited templates',
      'Basic support',
    ]),
    isPopular: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Starter',
    slug: 'starter',
    description: 'Perfect for individual creators and freelancers',
    price: 9.99,
    currency: 'USD',
    interval: 'monthly',
    wordsLimit: 50000,
    imagesLimit: 50,
    chatMessagesLimit: 500,
    codeLimit: 100,
    audioMinutesLimit: 30,
    features: JSON.stringify([
      '50,000 words per month',
      '50 images per month',
      '500 chat messages',
      '100 code generations',
      '30 minutes of speech',
      'All templates',
      'Priority support',
      'Export to PDF/Docx',
    ]),
    isPopular: false,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: 'Professional',
    slug: 'professional',
    description: 'For teams and professionals who need more power',
    price: 29.99,
    currency: 'USD',
    interval: 'monthly',
    wordsLimit: 200000,
    imagesLimit: 200,
    chatMessagesLimit: 0, // unlimited
    codeLimit: 0, // unlimited
    audioMinutesLimit: 120,
    features: JSON.stringify([
      '200,000 words per month',
      '200 images per month',
      'Unlimited chat messages',
      'Unlimited code generations',
      '120 minutes of speech',
      'All templates including premium',
      'Priority support',
      'Export to PDF/Docx',
      'API access',
      'Custom brand voice',
    ]),
    isPopular: true,
    isActive: true,
    sortOrder: 3,
  },
  {
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'For organizations that need unlimited AI power',
    price: 99.99,
    currency: 'USD',
    interval: 'monthly',
    wordsLimit: 0, // unlimited
    imagesLimit: 0, // unlimited
    chatMessagesLimit: 0, // unlimited
    codeLimit: 0, // unlimited
    audioMinutesLimit: 0, // unlimited
    features: JSON.stringify([
      'Unlimited words',
      'Unlimited images',
      'Unlimited chat messages',
      'Unlimited code generations',
      'Unlimited speech minutes',
      'All templates including premium',
      'Dedicated support manager',
      'Export to PDF/Docx',
      'Full API access',
      'Custom brand voice',
      'Team collaboration',
      'SSO authentication',
      'Custom integrations',
    ]),
    isPopular: false,
    isActive: true,
    sortOrder: 4,
  },
]

// ─── Settings ────────────────────────────────────────────────────────────────

const settings = [
  { key: 'site_name', value: 'Davinci AI' },
  { key: 'site_description', value: 'AI-Powered Content Generation Platform' },
  { key: 'default_model', value: 'gpt-4o-mini' },
  { key: 'openai_api_key', value: '' },
  { key: 'max_free_words', value: '5000' },
  { key: 'max_free_images', value: '10' },
]

// ─── Seed Function ───────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...\n')

  // Clean existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.generatedDoc.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.template.deleteMany()
  await prisma.templateCategory.deleteMany()
  await prisma.pricingPlan.deleteMany()
  await prisma.setting.deleteMany()
  console.log('✅ Cleaned existing data\n')

  // Seed categories
  console.log('📂 Seeding template categories...')
  const categoryMap: Record<string, string> = {}
  for (const cat of categories) {
    const record = await prisma.templateCategory.create({ data: cat })
    categoryMap[cat.slug] = record.id
    console.log(`  ✓ ${cat.name}`)
  }
  console.log('')

  // Seed templates
  console.log('📝 Seeding templates...')
  const categorySlugs: Record<number, string> = {
    1: 'article-blog-writing',
    2: 'article-blog-writing',
    3: 'article-blog-writing',
    4: 'article-blog-writing',
    5: 'article-blog-writing',
    6: 'article-blog-writing',
    7: 'article-blog-writing',
    8: 'article-blog-writing',
    9: 'article-blog-writing',
    10: 'ads-marketing',
    11: 'ads-marketing',
    12: 'ads-marketing',
    13: 'ads-marketing',
    14: 'ads-marketing',
    15: 'ads-marketing',
    16: 'ads-marketing',
    17: 'ads-marketing',
    18: 'ads-marketing',
    19: 'ads-marketing',
    20: 'social-media',
    21: 'social-media',
    22: 'social-media',
    23: 'social-media',
    24: 'social-media',
    25: 'social-media',
    26: 'social-media',
    27: 'email',
    28: 'email',
    29: 'email',
    30: 'email',
    31: 'website-seo',
    32: 'website-seo',
    33: 'website-seo',
    34: 'website-seo',
    35: 'website-seo',
    36: 'e-commerce',
    37: 'e-commerce',
    38: 'e-commerce',
    39: 'e-commerce',
    40: 'e-commerce',
    41: 'e-commerce',
    42: 'e-commerce',
    43: 'e-commerce',
    44: 'creative-writing',
    45: 'creative-writing',
    46: 'creative-writing',
    47: 'creative-writing',
    48: 'creative-writing',
    49: 'creative-writing',
    50: 'business',
    51: 'business',
    52: 'business',
    53: 'business',
    54: 'business',
    55: 'business',
    56: 'business',
    57: 'business',
    58: 'academic',
    59: 'academic',
    60: 'academic',
    61: 'academic',
    62: 'video-audio',
    63: 'video-audio',
    64: 'video-audio',
    65: 'video-audio',
    66: 'other-tools',
    67: 'other-tools',
    68: 'other-tools',
    69: 'other-tools',
  }

  let templateCount = 0
  for (const template of templates) {
    const catSlug = categorySlugs[template.sortOrder]
    const categoryId = categoryMap[catSlug]
    if (!categoryId) {
      console.log(`  ⚠ Skipping ${template.name} - no category found for slug: ${catSlug}`)
      continue
    }

    await prisma.template.create({
      data: {
        name: template.name,
        slug: template.slug,
        description: template.description,
        icon: template.icon,
        prompt: template.prompt,
        fields: template.fields,
        categoryId,
        outputType: template.outputType,
        toneOptions: template.toneOptions,
        languageOptions: template.languageOptions,
        isPremium: template.isPremium,
        isFeatured: template.isFeatured,
        sortOrder: template.sortOrder,
      },
    })
    templateCount++
    console.log(`  ✓ ${template.name}`)
  }
  console.log(`\n  Total templates: ${templateCount}\n`)

  // Seed pricing plans
  console.log('💰 Seeding pricing plans...')
  for (const plan of pricingPlans) {
    await prisma.pricingPlan.create({ data: plan })
    console.log(`  ✓ ${plan.name} ($${plan.price}/month)`)
  }
  console.log('')

  // Seed settings
  console.log('⚙️  Seeding settings...')
  for (const setting of settings) {
    await prisma.setting.create({ data: setting })
    console.log(`  ✓ ${setting.key}`)
  }
  console.log('')

  // Verify counts
  console.log('📊 Verification:')
  const catCount = await prisma.templateCategory.count()
  const tempCount = await prisma.template.count()
  const planCount = await prisma.pricingPlan.count()
  const settingCount = await prisma.setting.count()
  console.log(`  Categories: ${catCount}`)
  console.log(`  Templates: ${tempCount}`)
  console.log(`  Pricing Plans: ${planCount}`)
  console.log(`  Settings: ${settingCount}`)

  console.log('\n🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
