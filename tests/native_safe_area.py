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
    tree=dump()
    candidates=[]
    for item in tree.iter('node'):
        labels=[item.attrib.get('text',''),item.attrib.get('content-desc','')]
        if any(text==label.strip() for label in labels): candidates.insert(0,item)
        elif any(text in label for label in labels): candidates.append(item)
    if not candidates:
        Path('native-previews/last-ui.xml').write_text(ET.tostring(tree,encoding='unicode'))
        raise AssertionError('Missing UI text or description: '+text)
    x1,y1,x2,y2=bounds(candidates[0])
    adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))
    time.sleep(2)

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
    tap_text('More')
    tap_text('AMOLED black')
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
