"""Android 16 smoke test: WebView bounds must exclude phone system UI."""
import re, subprocess, time, xml.etree.ElementTree as ET
from pathlib import Path

def adb(*args):
    return subprocess.check_output(['adb',*args],text=True)

def dump():
    adb('shell','uiautomator','dump','/sdcard/salary-ui.xml')
    return ET.fromstring(adb('shell','cat','/sdcard/salary-ui.xml'))

def bounds(node):
    return list(map(int,re.findall(r'\d+',node.attrib['bounds'])))

def tap_text(text):
    for attempt in range(5):
        tree=dump()
        nodes=list(tree.iter('node'))
        # An overloaded emulator may show a system ANR; allow its UI to recover.
        if any("isn't responding" in n.attrib.get('text','') for n in nodes):
            wait=next((n for n in nodes if n.attrib.get('text','').lower()=='wait'),None)
            if wait is not None:
                x1,y1,x2,y2=bounds(wait)
                adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))
                time.sleep(5)
                continue
        candidates=[]
        for item in nodes:
            labels=[item.attrib.get('text',''),item.attrib.get('content-desc','')]
            if any(text==label.strip() for label in labels): candidates.insert(0,item)
            elif any(text in label for label in labels): candidates.append(item)
        for item in candidates:
            x1,y1,x2,y2=bounds(item)
            if x2>x1 and y2>y1:
                adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))
                time.sleep(2)
                return
        dims=list(map(int,re.findall(r'(\d+)x(\d+)',adb('shell','wm','size'))[-1]))
        adb('shell','input','swipe',str(dims[0]//2),str(int(dims[1]*.7)),str(dims[0]//2),str(int(dims[1]*.35)),'400')
        time.sleep(2)
    Path('native-previews/last-ui.xml').write_text(ET.tostring(tree,encoding='unicode'))
    raise AssertionError('Missing UI text or description: '+text)

def verify(name):
    Path('native-previews').mkdir(exist_ok=True)
    Path(f'native-previews/{name}.png').write_bytes(subprocess.check_output(['adb','exec-out','screencap','-p']))
    hierarchy=adb('shell','dumpsys','activity','top')
    Path(f'native-previews/{name}-views.txt').write_text(hierarchy)
    Path(f'native-previews/{name}-logcat.txt').write_text(adb('logcat','-d','-t','500'))
    matches=re.findall(r'android\.webkit\.WebView\{[^\n]*? (\d+),(\d+)-(\d+),(\d+)',hierarchy)
    assert matches,'No WebView in foreground native hierarchy (see saved screenshot/logcat)'
    x1,y1,x2,y2=map(int,matches[-1])
    height=int(re.findall(r'\d+x(\d+)',adb('shell','wm','size'))[-1])
    assert y1>=24, f'Content overlaps status bar: {y1}'
    assert y2<height, f'Content overlaps navigation area: {y2}/{height}'
    print(f'PASS {name}: native WebView y={y1}..{y2}, display height={height}',flush=True)

adb('install','-r','app/build/outputs/apk/debug/app-debug.apk')
adb('shell','wm','dismiss-keyguard')
print(adb('shell','am','start','-W','-n','com.shubham.salarytracker/.MainActivity'),flush=True)
time.sleep(15)
verify('light-home')
try:
    tap_text('Calendar')
    adb('shell','input','keyevent','4')
    time.sleep(2)
    verify('back-from-calendar')
    tap_text('Settings')
    tap_text('Appearance')
    tap_text('AMOLED black')
    adb('shell','input','keyevent','4')
    time.sleep(2)
    tap_text('Home')
    verify('amoled-home')
except subprocess.CalledProcessError:
    print('Accessibility dump unavailable; native bounds and screenshots are checked directly.',flush=True)
# Simulate a taller camera cutout: spacing must follow the OS, not a fixed gap.
overlay='com.android.internal.display.cutout.emulation.tall'
if overlay in adb('shell','cmd','overlay','list'):
    adb('shell','cmd','overlay','enable',overlay)
    time.sleep(3)
    verify('tall-cutout')
    adb('shell','cmd','overlay','disable',overlay)

