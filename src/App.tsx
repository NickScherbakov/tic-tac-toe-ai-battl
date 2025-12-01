import { useIsTouchMobile } from '@/hooks/use-mobile';
import { MobileFlow } from '@/components/MobileFlow';
import { DesktopFlow } from '@/components/DesktopFlow';

function App() {
  const isTouchMobile = useIsTouchMobile();
  if (isTouchMobile) return <MobileFlow />;
  return <DesktopFlow />;
}

export default App;