import { useEffect } from 'react';
import { useIsTouchMobile } from '@/hooks/use-mobile';
import { MobileFlow } from '@/components/MobileFlow';
import { DesktopFlow } from '@/components/DesktopFlow';

function App() {
  const isTouchMobile = useIsTouchMobile();

  useEffect(() => {
    const title = 'Tic-Tac-Toe AI Battle — Strategy Showdowns, Replays & Challenges';
    const description = 'Predict AI tic-tac-toe battles, send replay links, and challenge your friends.';
    const currentUrl = window.location.href;

    document.title = title;

    const setMeta = (selector: string, attribute: 'content' | 'href', value: string) => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute(attribute, value);
      }
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', currentUrl);
    setMeta('link[rel="canonical"]', 'href', currentUrl.split('#')[0]);
  }, []);

  if (isTouchMobile) return <MobileFlow />;
  return <DesktopFlow />;
}

export default App;