  const location = useLocation() // Get current location

  const postDetailUrl = post.circles?.slug ? `/${post.circles.slug}/p/${post.id}` : `/p/${post.id}`;
  const isDedicatedPostPage = location.pathname === postDetailUrl;

  // Initialize repliesOpen based on whether it's a dedicated post page
  const [repliesOpen, setRepliesOpen] = useState(isDedicatedPostPage);
