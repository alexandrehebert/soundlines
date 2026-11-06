"""Render the reviewed instrument SVGs from banner masters and matching icon paths.

Run from the repository root: python3 scripts/generate-instrument-artwork.py
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'public'
SVG = 'http://www.w3.org/2000/svg'
ARTWORK_TILT = -9
WOOD = 'url(#wood)'
EDGE = '#f3d5a5'
DARK = '#362535'
GOLD = '#edbc76'
WIRE = '#fff0d2'


def path(d, fill='none', stroke=EDGE, w=1.3):
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}"/>'


def rect(x, y, w, h, fill, rx=2, stroke='none'):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}"/>'


def ellipse(x, y, rx, ry, fill, stroke='none'):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}"/>'


def strings(start, end, count, spread=2, color=WIRE):
    return ''.join(path(
        f'M{start} {offset*spread:g}L{end} {offset*spread*.72:.2f}',
        stroke=color, w=.62,
    ) for offset in [i-(count-1)/2 for i in range(count)])


def frets(start, stop, step, shape='M{x} -7q-3 7 0 14', width=.85):
    return ''.join(path(shape.format(x=x), stroke=GOLD, w=width) for x in range(start, stop, step))


def pegs(points, color=GOLD):
    return ''.join(path(f'M{x} {y*.54:g}v{y*.46:g}', stroke=color, w=1.8)
                   + ellipse(x, y, 3.6, 2.35, color) for x, y in points)


def rosette(x, radius=10):
    return (ellipse(x, 0, radius, radius, DARK, GOLD)
            + ellipse(x, 0, radius-3, radius-3, 'none', GOLD)
            + path(f'M{x-radius+3} 0l{radius-3} {-radius+3} {radius-3} {radius-3} '
                   f'{-radius+3} {radius-3}Z', stroke=GOLD, w=.8))


def plucked(name):
    if name == 'algerian-mandole':
        # Long scale and teardrop soundbox on the Farid Chafaa reference.
        return (path('M-39-10Q-67-31-85-32Q-118-32-120 0Q-118 32-85 32Q-67 31-39 10Z', WOOD)
                + path('M-45-8L98-6V6L-45 8Z', DARK)
                + path('M98-7L122-10V10L98 7Z', WOOD)
                + rosette(-66, 11) + rect(-99, -11, 5, 22, DARK)
                + frets(-35, 98, 8, 'M{x} -6v12')
                + pegs([(x, y) for x in (101, 107, 113, 119) for y in (-12, 12)])
                + strings(-97, 119, 8, 1.55))
    if name == 'charango':
        return (path('M-29-18Q-36-27-53-23Q-63-18-73-29Q-88-41-109-30Q-124-21-124 0'
                     'Q-124 21-109 30Q-88 41-73 29Q-63 18-53 23Q-36 27-29 18Z', WOOD)
                + path('M-37-10L38-8V8L-37 10Z', DARK)
                + path('M38-9L75-13V13L38 9Z', WOOD)
                + rosette(-57, 12) + rect(-102, -13, 5, 26, DARK)
                + frets(-34, 39, 6, 'M{x} -8v16')
                + pegs([(x, y) for x in (44, 50, 56, 62, 68) for y in (-16, 16)])
                + strings(-99, 69, 10, 1.65))
    return (path('M-28 0Q-39-22-71-35Q-117-50-124 0Q-117 50-71 35Q-39 22-28 0Z', WOOD)
            + path('M-53-13L42-10V10L-53 13Z', DARK)
            + path('M42-10L61-34L73-30L50 9Z', '#8d593a')
            + rosette(-69, 15) + rect(-103, -13, 6, 26, DARK)
            + frets(-46, 43, 8, 'M{x} -9v18')
            + ''.join(ellipse(x, y, 3.2, 2.6, GOLD) for x, y in [(47,-13),(53,-20),(58,-27),(57,-9),(62,-17),(68,-24)])
            + strings(-101, 43, 10, 1.9))


def bowed(name):
    bodies = {
        'violin': 'M-38 0Q-37-23-52-25Q-65-28-71-19Q-77-13-82-20L-85-29'
                  'Q-109-39-125-25Q-137-16-137 0Q-137 16-125 25Q-109 39-85 29L-82 20'
                  'Q-77 13-71 19Q-65 28-52 25Q-37 23-38 0Z',
        'viola': 'M-30 0C-32-13-36-26-50-27C-60-28-65-21-70-20C-77-17-79-24-76-31'
                 'C-91-41-119-38-127-25Q-140 0-127 25C-119 38-91 41-76 31C-79 24-77 17-70 20'
                 'C-65 21-60 28-50 27C-36 26-32 13-30 0Z',
        'cello': 'M-22 0C-23-17-30-30-45-31Q-60-33-67-25Q-73-19-81-23L-86-34'
                 'Q-112-48-132-33Q-145-23-145 0Q-145 23-132 33Q-112 48-86 34L-81 23'
                 'Q-73 19-67 25Q-60 33-45 31C-30 30-23 17-22 0Z',
        'double-bass': 'M-18 0Q-31-6-44-22Q-55-35-69-28Q-78-23-84-26L-91-39'
                       'Q-116-49-139-36Q-151-27-151 0Q-151 27-139 36Q-116 49-91 39L-84 26'
                       'Q-78 23-69 28Q-55 35-44 22Q-31 6-18 0Z',
    }
    end = {'violin': 36, 'viola': 36, 'cello': 66, 'double-bass': 71}[name]
    tail = {'violin': -132, 'viola': -126, 'cello': -141, 'double-bass': -147}[name]
    f_holes = ''.join(f'<g transform="scale(1 {s})">'
                      + path('M-68 14q-5-5-8 1t-14 4q-5 0-4 4', stroke=DARK, w=2.4)
                      + ellipse(-69, 14, 2, 2, DARK) + ellipse(-94, 23, 2, 2, DARK) + '</g>'
                      for s in (1,-1))
    return (path(bodies[name], WOOD) + f_holes
            + path(f'M-79-10L{end-13}-4V4L-79 10Z', DARK)
            + path(f'M{end-15}-5h15q9 0 9 6q0 7-8 6l-5-2l3-3q5 2 5-1q0-3-5-2l-14 4Z', WOOD)
            + pegs([(end-14,-9),(end-9,10),(end-4,-9),(end,10)])
            + path(f'M{tail}-2l35-5v14l-35-5Z', DARK)
            + path('M-89-11q7 11 0 22', stroke=GOLD, w=3)
            + (path(f'M{tail-4} 0h-19', stroke='#b8c4d0', w=2.5) if name in ('cello', 'double-bass') else '')
            + strings(tail+7, end-1, 4, 2)
            + path('M-101 45Q-14 40 63 44M-101 50L63 44', stroke=GOLD, w=1.6)
            + rect(-103, 44, 10, 6, DARK, stroke=GOLD))


def indian(name):
    if name == 'sarod':
        return (path('M-43-18Q-63-37-91-34Q-120-32-123 0Q-120 32-91 34Q-63 37-43 18Z', WOOD)
                + ellipse(-91, 0, 27, 28, '#e3cfaa', '#987251')
                + path('M-63-17L66-8L90-11L108 0L90 11L66 8L-63 17Z', '#9eb5c5', '#e4edf4')
                + path('M-117-11L-96-13V13L-117 11Z', DARK)
                + rect(-96,-13,4,26,'#a27853') + strings(-111, 91, 8, 2.4, '#343d4c')
                + pegs([(x, -15 if x%2 else 15) for x in (10,19,28,37,46,55,64,73,82,91)]))
    sitar = name == 'sitar'
    body = ('M-45-14Q-58-37-86-41Q-125-43-129-8Q-134 25-105 37Q-67 48-45 14Z' if sitar else
            'M-46-8Q-56-30-75-41Q-104-53-125-29Q-145-4-129 26Q-114 53-83 46Q-56 37-46 8Z')
    return (path(body, WOOD) + ellipse(-92,0,29,34,'none',GOLD)
            + path('M-53-12L104-8L120-11V11L104 8L-53 12Z', DARK)
            + rect(-104,-11,6,22,'#e2ca9a', stroke=GOLD)
            + (frets(-52, 99, 8, 'M{x} -12q-6 12 0 24', 1.7) if sitar else '')
            + pegs(([(x, 17 if i%2 else -17) for i,x in enumerate(range(-23, 111, 11))]
                    + [(104,-22),(114,23)]) if sitar else [(83,-20),(95,20),(106,-21),(117,20)])
            + strings(-104, 116, 7 if sitar else 4, 2))


def hichiriki():
    return (path('M-70-8Q-21-10 80-12L87-11V11L80 12Q-21 10-70 8Z', WOOD, '#a7f3d0')
            + path('M-70-5L-85-5L-104-10L-111-8V8L-104 10L-85 5H-70Z', '#dfb977', '#f9dd9e')
            + rect(-87,-6,12,12,'#a07050',1)
            + ''.join(rect(x,-10,5,20,'#aa8260',1) for x in (-64,-45,-24,-3,18,39,61,76))
            + ''.join(ellipse(x,0,3.2,3,'#111522','#a1a8ad') for x in (-55,-35,-14,7,28,50,69)))


def pedal_steel():
    return (path('M-99-8V43M99-8V43M-80-7V33M81-7V33', stroke='#acbfd4', w=3)
            + path('M-94 34H93M-43 32V9M-27 32V9M-11 32V9M5 32V9', stroke='#aebfce', w=2)
            + ''.join(path(f'M{x} 35l-5 9h10', stroke='#e7eef3', w=2.5) for x in (-43,-27,-11,5))
            + path('M-112-14L-96-37H109L116-14V5H-112Z', WOOD)
            + path('M-112-14H116M-95-20H99L92-32H-88Z', '#2a2936', GOLD)
            + rect(-92,-27,15,9,'#9cafbf') + rect(77,-28,15,9,'#a8bccc')
            + ''.join(path(f'M-79 {y}H80', stroke='#ede5d1',w=.65) for y in range(-31,-19,2))
            + ''.join(path(f'M{x} -31v12', stroke=GOLD,w=.62) for x in range(-71,70,11))
            + rect(-101,-7,33,5,'#483139', stroke=GOLD))


def knobs(xs, y, radius):
    return ''.join(ellipse(x,y,radius,radius,'#373b43','#161b27')
                   + path(f'M{x} {y-1}v{-radius+1}',stroke='#ebeced',w=.8) for x in xs)


def panel_text(x, y, content, size=5, color='#283747'):
    return (f'<text x="{x}" y="{y}" font-family="sans-serif" font-weight="700" '
            f'font-size="{size}" fill="{color}">{content}</text>')


def tb303():
    return (rect(-112,-38,224,78,'#18516b',6,'#7dd3fc')
            + rect(-110,-41,220,74,WOOD,5,'#bae6fd')
            + panel_text(-99,-29,'TB-303',10) + panel_text(-99,-22,'BASS LINE')
            + rect(-19,-35,124,26,'#74c4e5',2,'#3b7f9d')
            + knobs(range(-9,97,20),-25,5.2)
            + panel_text(-14,-13,'TUNE      CUT OFF      RES      ENV MOD      DECAY      ACCENT',3.8)
            + path('M-103-8H102M-103 9H102',stroke='#526571',w=1)
            + ''.join(rect(x,-3,11,7,'#e4e4dc',1,'#67727b') for x in range(-96,98,16))
            + ''.join(rect(x,14,11,12,'#eeeee7',1,'#67727b') for x in range(-95,97,14))
            + ''.join(rect(x,11,8,8,'#39444f',1,'#1e2833') for x in (-86,-72,-44,-30,-16,12,26))
            + ''.join(ellipse(x,-5,1.45,1.45,'#ba4836') for x in range(-91,101,16))
            + panel_text(49,23,'RUN / STOP',4.3,'#e0f2fe'))


def tr909():
    body = rect(-135,-47,270,98,'#18516b',4,'#7dd3fc') + rect(-133,-49,266,94,WOOD,3,'#bae6fd')
    sections = ''.join(path(f'M{x}-36v40',stroke='#a4d9eb',w=.7) for x in (-92,-58,-19,22,53,86))
    step_keys = ''.join(rect(-126+16*i,20,13,17,'#f2ebe1' if i//4%2==0 else '#bfc2bc',1,'#727b7e')
                        + ellipse(-119.5+16*i,16,1.6,1.6,'#c86748') for i in range(16))
    return (body + panel_text(-125,-36,'TR-909',10) + panel_text(-84,-36,'RHYTHM COMPOSER',5.5)
            + path('M-126-31H126M-126 10H126',stroke='#ba7654',w=1.5)
            + sections + knobs(range(-117,125,15),-21,4.7)
            + knobs((-117,-101,-82,-67,-47,-32,-10,7,29,43,60,76),-5,4)
            + rect(91,-13,31,16,'#31383a',1,'#b89376') + panel_text(96,-2,'120',9,'#f17959')
            + step_keys + panel_text(-125,42,'1                 2                 3                 4',3.9,'#e0f2fe'))


def auto_tune():
    grid = ''.join(path(f'M{x} -23V42', stroke='#304359', w=.7) for x in range(-93,118,14))
    grid += ''.join(path(f'M-104 {y}H118', stroke='#304359', w=.7) for y in range(-20,43,8))
    notes = [(-99, 22, 38), (-59, 7, 55), (0, 14, 46), (49, -7, 64)]
    return (rect(-124,-52,248,104,WOOD,5,'#bae6fd')
            + panel_text(-112,-36,'AUTO-TUNE',10,'#0c2536')
            + rect(73,-46,43,13,'#122f45') + panel_text(80,-37,'GRAPH',7,'#bae6fd')
            + rect(-117,-27,234,73,'#121c30') + grid
            + ''.join(rect(-116,y,12,7,'#dae8f0' if i%3 else '#64748b',0)
                      for i,y in enumerate(range(-21,42,8)))
            + ''.join(rect(x,y,width,6,'#48baf0',1) for x,y,width in notes)
            + path('M-99 27q8-11 17-4t21-3l5-8q8-7 18-1t35-2l6 9q9-6 20-2t24-4l5-11q9-10 20-5t20-1t20 2',
                   stroke='#f0a982', w=2))


def bassoon():
    # Boot at left, full-length bass joint and bell above the shorter wing joint.
    return (path('M-107-13L105-17L114-20H120V1H114L105-2L-107 2Z', WOOD, '#a7f3d0')
            + path('M-103 2L18 6L24 9V18L-103 23Z', '#216b54', '#a7f3d0')
            + path('M-107-14Q-119-14-119-3V16Q-119 24-109 24H-96V-14Z',
                   '#226e58', '#a7f3d0')
            + path('M-113-11V21M-98-13V23M113-19V1', stroke='#c9e7dc', w=2.6)
            + path('M22 11C33 9 35 20 45 20S63 14 58 7', stroke='#e3ebe8', w=2.5)
            + path('M58 7l-6-5', stroke='#efd19a', w=2.8)
            + path('M-93-7H83M-94 14H11M-63 5V19M-28 4V18',
                   stroke='#bcd4d5', w=1.25)
            + ''.join(ellipse(x,y,rx,2.5,'#dbe8e6','#335457')
                      for x,y,rx in [(-86,-7,4),(-72,-7,3),(-55,-7,4),(-34,-7,3),
                                     (-17,-7,4),(5,-7,3),(29,-7,4),(52,-7,3),(78,-7,4),
                                     (-85,14,4),(-67,14,3),(-50,14,4),(-33,14,3),
                                     (-15,13,4),(4,12,3)]))


def conga():
    return ('<g transform="scale(.78 1)">'
            + path('M-43-43C-49-24-51-8-47 10Q-42 33-26 56Q0 66 26 56Q42 33 47 10'
                 'C51-8 49-24 43-43Z', WOOD, '#fecaca')
            + path('M-23-36Q-35 11-14 56M23-36Q35 11 14 56M0-34V59',
                   stroke='#fca5a5', w=.9)
            + ellipse(0,-42,44,12,'#f3c49e','#fee2e2')
            + path('M-44-42Q-44-26 0-25Q44-26 44-42', stroke='#f8d8cf', w=3)
            + ''.join(path(f'M{x} {y}v18m-3-1h6', stroke='#f4e3db', w=2.8)
                      for x,y in [(-37,-34),(-19,-28),(19,-28),(37,-34)])
            + path('M-27 53Q0 63 27 53', stroke='#ffd9cf', w=3) + '</g>')


def keyboard(x, y, width, height, white_keys):
    step = width / white_keys
    return (rect(x,y,width,height,'#e6eaf0',1)
            + ''.join(path(f'M{x+i*step:.2f} {y}v{height}', stroke='#788292', w=.55)
                      for i in range(1,white_keys))
            + ''.join(rect(round(x+i*step-step*.29,2),y,round(step*.58,2),round(height*.58,2),'#182337',.4)
                      for i in range(1,white_keys) if i%7 in (1,2,4,5,6)))


def harmonium():
    return (path('M-110-18L-90-54H104L115-18Z', '#343761', '#c7d2fe')
            + ''.join(path(f'M{-106+i*4} {-22-i*6}H{111-i*2}', stroke='#a5b4fc', w=2)
                      for i in range(6))
            + rect(-114,-18,228,70,WOOD,5,'#c7d2fe')
            + keyboard(-99,-11,198,37,22)
            + rect(-101,31,202,13,'#303662',3,'#a5b4fc')
            + ''.join(ellipse(x,37.5,4.5,4.5,'#d2daff','#6b73ab') for x in range(-83,84,21))
            + rect(-31,47,62,3,'#a5b4fc'))


def synthesizer(name):
    juno = name == 'juno-106'
    width = 264 if juno else 220
    left = -width // 2
    panel_y = -38 if juno else -56
    groups = (-83,-58,-29,4,42,77) if juno else (-86,-51,-15,20,54,86)
    body = rect(left,panel_y,width,44-panel_y,WOOD,5,'#bae6fd')
    body += rect(left+5,panel_y+4,width-10,-panel_y+5,'#18283c',2,'#67aac6')
    body += keyboard(left+37,12,width-43,27,36 if juno else 26)
    if juno:
        body += rect(-122,-26,24,11,'#2a3a53') + panel_text(-120,-18,'106',7,'#ff9278')
        body += path('M-127 3H127', stroke='#e36681', w=2)
        body += rect(-123,22,20,7,'#647f9b')
        for x in groups:
            body += path(f'M{x-6}-31v30', stroke='#627d97', w=.7)
            for offset,y in [(0,-20),(6,-12),(12,-17)]:
                body += path(f'M{x+offset}-25v20', stroke='#7094aa', w=1)
                body += rect(x+offset-1.5,y,3,4,'#c3deeb',.5)
        return body + panel_text(94,-24,'JUNO-106',5.5,'#d6eefa')
    body += path('M-109-53l7-3V43h-7ZM109-53l-7-3V43h7Z', '#aa7957', '#ddaf83')
    body += rect(-97,18,8,16,'#26394d',2,'#83a4b6') + rect(-85,18,8,16,'#26394d',2,'#83a4b6')
    body += path('M-100 5H100', stroke='#8bc8e4', w=2)
    for x in groups:
        body += path(f'M{x-8}-49v52', stroke='#648397', w=.7)
        for y,offset in [(-40,0),(-25,6),(-10,0)]:
            body += ellipse(x+offset,y,5,5,'#27384b','#a8cde2')
            body += path(f'M{x+offset} {y}v-3', stroke='#dae9f5', w=1)
    return body + panel_text(-91,-46,'MINIMOOG MODEL D',5.5,'#d6eefa')


def piccolo():
    return (path('M-118-6H117V6H-118Z', WOOD, '#a7f3d0')
            + rect(-118,-7,64,14,'#a4c9c3',2,'#daf8ee')
            + rect(-114,-5,57,10,'#a4c9c3')
            + path('M-54-7H119V7H-54Z', '#235c50', '#77cbb2')
            + ellipse(-91,0,8,4,'#1b3941','#e0f4e9')
            + path('M-50 8H111M-47-8H115', stroke='#b8dbd1', w=1.6)
            + ''.join(ellipse(x,0,4.5,4.5,'#c6e6db','#496a6b') for x in (-44,-32,-20,2,14,26,48,60,72,94,106))
            + path('M-53-8V8m168-16V8', stroke='#e0f4e9', w=2))


def vibraphone():
    frame = (path('M-108-4L-100 51M107-4L99 51M-100 43H99M-31 43H38',
                  stroke='#a8b8c9', w=4)
             + path('M-5 13V45l-9 7H7', stroke='#dfedf6', w=2.8)
             + ellipse(-100,54,5,4,'#748298') + ellipse(99,54,5,4,'#748298'))
    tubes = ''.join(rect(-99+i*14,0,7,33-i*1.4,'#a8737e',3,'#f6b9bf') for i in range(15))
    rails = path('M-115-21L-99-44H101L115-23V1H-115Z', WOOD, '#fca5a5')
    bars = ''.join(rect(-108+i*14,-21,11,23-i*.52,'#e7dde4',1,'#8c6472') for i in range(16))
    bars += ''.join(rect(-99+i*14,-40,9,17-i*.26,'#bcb7c8',1,'#875b6b')
                    for i in range(14) if i%7 in (0,1,3,4,5))
    return frame + tubes + rails + bars


SAXOPHONE_OUTLINE = (
    'M3 5.5 6 4c2-1 4.3-.1 4.8 2.2l2.4 11a1.5 1.5 0 0 0 3-.1'
    'l.7-4.5-1-2.2 6 1.1-1.9 1.7-.9 4.5a4.7 4.7 0 0 1-9.2.1'
    'L7.2 7.3c-.2-.8-1-1.1-1.7-.8l-1.6.8Z'
)


def saxophone():
    return ('<g transform="scale(6) translate(-12 -12)">'
            + path(SAXOPHONE_OUTLINE, WOOD, '#a7f3d0', .23)
            + path('M2.4 5.7l1.7-.9.9 1.9-1.1.6-1.7-.4Z', '#182730', '#8cd7c1', .15)
            + '<g transform="rotate(10 19 11)">'
            + ellipse(19,11,3.05,.82,'#12382f','#a7f3d0') + '</g>'
            + path('M8.1 8.3l2 9.1M10.4 8l1.9 8.7M14.7 17.6l3.2-1.2',
                   stroke='#a6d5c4', w=.22)
            + ''.join(ellipse(x,y,.64,.44,'#dcf7ea','#326c5e')
                      for x,y in [(9.4,8.9),(9.75,10.4),(10.1,11.9),(10.45,13.4),
                                  (10.8,14.9),(11.15,16.4)])
            + path('M11.7 18.5q1.7 2.9 4.8 1.3', stroke='#72c6aa', w=.26)
            + '</g>')


# Icon paths keep the banner's defining shapes and drop small controls and strings.
ART = {
    'saxophone': (lambda _: saxophone(), 1.02,
                  SAXOPHONE_OUTLINE + 'M17 12.6l3 .6M9.5 9.5h.01m.6 2.6h.01m.6 2.6h.01'),
    'auto-tune': (lambda _: auto_tune(), 1.05, 'M2 5h20v14H2zM2 8h20M6 8v11M8.5 15h3m1-3h3m1 2h3'),
    'bassoon': (lambda _: bassoon(), 1.08, 'M20 7h2v4h-2M4 8h16v2H4M4 10l9 1v4H4M4 8H3q-1 0-1 1v5q0 1 1 1h1ZM13 13q2 0 3 2t3-1'),
    'conga': (lambda _: conga(), 1.03, 'M6.5 5c0-3 11-3 11 0s-11 3-11 0ZM6.5 5c-1 6 0 10 2.5 15q3 2 6 0c2.5-5 3.5-9 2.5-15M9 8v3m6-3v3'),
    'harmonium': (lambda _: harmonium(), 1.05, 'M2 9l2-5h16l2 5v11H2ZM3 7h18M2 9h20M5 11h14v5H5zM9 11v3m6-3v3M8 18h.01m4 0h.01m4 0h.01'),
    'juno-106': (synthesizer, 1.05, 'M2 7h20v10H2zM2 12h20M7 12v5m3-5v5m3-5v5m3-5v5m3-5v5M5 9.5h2m4-1v2m4-2v2m4-2v2'),
    'minimoog': (synthesizer, 1.02, 'M4 5h16l2 8v6H2v-6zM2 13h20M7 13v6m4-6v6m4-6v6m4-6v6M7 9h.01m5 0h.01m5 0h.01M4.5 15v2'),
    'piccolo': (lambda _: piccolo(), .67, 'M5 10.5h14v3H5zM9 10.5v3M7 12h.01m4.5 0h.01m2.5 0h.01m2.5 0h.01'),
    'vibraphone': (lambda _: vibraphone(), 1.10, 'M4 5h16l2 7H2zM3 9h18M8 5l-1 4m9-4 1 4M7 9v3m5-3v3m5-3v3M4 12v8m16-8v8M4 18h16M8 12v3m4-3v4m4-4v2M12 18v2h3'),
    'violin': (bowed, 1.15, 'M11 9V4l-1-1V2h4v1l-1 1v5c2-1 3.5 0 3.5 2l-1.5 2.5 2 3c1 2.5-.5 4.5-5 4.5s-6-2-5-4.5l2-3L7.5 11c0-2 1.5-3 3.5-2ZM10.5 16.5h3M21 5v12.5'),
    'algerian-mandole': (plucked, 1.08, 'M10.5 9V3l-.5-1h4l-.5 1v6c2 2 5 5 5 8a6.5 5 0 0 1-13 0c0-3 3-6 5-8ZM12 15h.01M10 19h4'),
    'cello': (bowed, 1.05, 'M11 10V4l-1-1V2h4v1l-1 1v6c2-1 4 0 4 2l-1.5 2 2 3c1 2-.5 4-5.5 4s-6.5-2-5.5-4l2-3L7 12c0-2 2-3 4-2ZM10.5 16h3M12 21v2M21.5 5v12.5'),
    'charango': (plucked, 1.26, 'M10.5 9V6H9V2h6v4h-1.5v3c2.5-1 4.5 0 4.5 2 0 1-1 2-1 3s2 2 2 4c0 3-2 4-7 4s-7-1-7-4c0-2 2-3 2-4s-1-2-1-3c0-2 2-3 4.5-2ZM12 14h.01M10 19h4'),
    'double-bass': (bowed, 1.03, 'M11 9V4l-1-1V2h4v1l-1 1v5l3 2c1.5 1 1 2 0 3l2 3c1 2-.5 4-6 4s-7-2-6-4l2-3c-1-1-1.5-2 0-3l3-2ZM10 16h4M12 21v2M21 5v12.5'),
    'hichiriki': (lambda _: hichiriki(), 1.16, 'M6 10h14v4H6zM6 11H4L1.5 9.5v5L4 13h2M9 12h.01m3 0h.01m3 0h.01m3 0h.01'),
    'lute': (plucked, 1.22, 'M12 10c-3-2-8-1-9 3-2 6 6 8 9 3 1-1 1-3 1-3l6-7 2 1 1-2-4-2zM8 14h.01'),
    'pedal-steel-guitar': (lambda _: pedal_steel(), 1.12, 'M2 7h20v5H2zM5 12v9m14-9v9M5 18h14M9 13v5l-1 2m5-7v5l-1 2'),
    'sarod': (indian, 1.14, 'M8.5 14 10.5 4 12 2l1.5 2 2 10c2 1 3 2 3 4a6.5 4 0 0 1-13 0c0-2 1-3 3-4ZM8.5 14h7M10 18h4'),
    'sitar': (indian, 1.05, 'M9.75 13V3l.75-1h3l.75 1v10a5.5 5 0 1 1-4.5 0ZM10 5q2-1 4 0m-4 3q2-1 4 0m-4 3q2-1 4 0M10 18h4'),
    'tanpura': (indian, 1.05, 'M10.5 13V2h3v11a5.5 5 0 1 1-3 0ZM8.5 4h2m3 0h2M12 13v5m-2 1h4'),
    'tb-303': (lambda _: tb303(), 1.12, 'M2 7h20v10H2zM11 10h.01m3 0h.01m3 0h.01m3 0h.01M5 14h14m-11-1v2m4-2v2m4-2v2'),
    'tr-909': (lambda _: tr909(), 1.02, 'M2 5h20v14H2zM6 9h.01M10 9h.01M15 8h4v3h-4zM6 15v1m4-1v1m4-1v1m4-1v1'),
    'viola': (bowed, 1.19, 'M11 9V4l-1-1V2h4v1l-1 1v5c2-1 4 0 4 2l-1.5 2.5 2 3c1.5 2.5-.5 5.5-5.5 5.5s-7-3-5.5-5.5l2-3L7 11c0-2 2-3 4-2ZM10 17h4M22 5v12.5'),
}


def write(kind, slug, width, height, content):
    target = ROOT / f'instrument-{kind}' / f'{slug}.svg'
    assert target.is_file(), target
    dimensions = ' width="24" height="24"' if kind == 'icons' else ''
    target.write_text(f'<svg xmlns="{SVG}"{dimensions} viewBox="0 0 {width} {height}">\n{content}\n</svg>\n')


def illustration(kind, slug, width, height, geometry, scale):
    accent, shade = {
        'auto-tune': ('#38bdf8', '#18516b'),
        'bassoon': ('#34d399', '#165b42'),
        'conga': ('#ef4444', '#671d1d'),
        'harmonium': ('#818cf8', '#373c6b'),
        'juno-106': ('#38bdf8', '#18516b'),
        'minimoog': ('#38bdf8', '#18516b'),
        'piccolo': ('#34d399', '#165b42'),
        'vibraphone': ('#ef4444', '#671d1d'),
        'hichiriki': ('#34d399', '#165b42'),
        'saxophone': ('#34d399', '#165b42'),
        'tb-303': ('#38bdf8', '#18516b'),
        'tr-909': ('#38bdf8', '#18516b'),
    }.get(slug, ('#d9a067', '#674437'))
    header = kind == 'header-backgrounds'
    avatar = kind == 'avatars'
    definitions = f'''<defs>
  <linearGradient id="wood" x1="0%" y1="0%" x2="38%" y2="100%"><stop stop-color="{accent}"/><stop offset="1" stop-color="{shade}"/></linearGradient>
  <radialGradient id="halo"><stop stop-color="{accent}" stop-opacity="{'.18' if header else '.23'}"/><stop offset="1" stop-color="{shade}" stop-opacity="0"/></radialGradient>
  {"<linearGradient id='fade'><stop offset='.33' stop-color='white' stop-opacity='0'/><stop offset='.61' stop-color='white' stop-opacity='.27'/><stop offset='.88' stop-color='white' stop-opacity='.61'/><stop offset='1' stop-color='white' stop-opacity='.42'/></linearGradient><mask id='reveal' maskUnits='userSpaceOnUse'><rect width='360' height='120' fill='url(#fade)'/></mask>" if header else f'<pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="{accent}" stroke-opacity=".19" stroke-width="1"/></pattern>'}
</defs>'''
    if header:
        x, y = 262, 64
        if slug in ('charango', 'lute', 'violin', 'viola', 'cello', 'double-bass'):
            x += 14
        backdrop = ellipse(x, y, 92, 58, 'url(#halo)')
        frame = f'<g mask="url(#reveal)"><g transform="translate({x} {y}) rotate({ARTWORK_TILT}) scale({scale*.61:.3f})">{geometry}</g></g>'
    else:
        x, y = (80, 80) if avatar else (180, 77)
        if slug in ('charango', 'lute', 'violin', 'viola'):
            x += 17 if avatar else 24
        elif slug in ('cello','double-bass'):
            x += 20 if avatar else 32
        if not avatar and slug in ('violin', 'viola', 'cello', 'double-bass'):
            y -= 6
        if avatar:
            scale *= .48
        backdrop = (rect(0,0,width,height,'#0b1020',0) + ellipse(width/2,height/2,width*.52,height*.51,'url(#halo)')
                    + rect(0,0,width,height,'url(#grid)',0))
        frame = f'<g transform="translate({x} {y}) rotate({ARTWORK_TILT}) scale({scale:.3f})">{geometry}</g>'
    write(kind, slug, width, height, definitions + '\n' + backdrop + '\n' + frame)


ICON_ANGLES = dict.fromkeys(
    ('algerian-mandole', 'charango', 'sarod', 'sitar', 'viola', 'violin'), 42,
)
ICON_ANGLES.update({
    'bassoon': -58,
    'cello': 15,
    'double-bass': 15,
    'hichiriki': 78,
    'tanpura': 22,
})


def main():
    masters = {slug: (draw(slug), scale, icon) for slug,(draw,scale,icon) in ART.items()}
    for kind, width, height in [('banners',360,160), ('header-backgrounds',360,120), ('avatars',160,160)]:
        for slug, (geometry, scale, _) in masters.items():
            illustration(kind, slug, width, height, geometry, scale)
    for slug, (_, _, icon) in masters.items():
        angle = ICON_ANGLES.get(slug, 0)
        transform = f' transform="rotate({angle} 12 12)"' if angle else ''
        write('icons',slug,24,24,f'<path d="{icon}"{transform} fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>')


if __name__ == '__main__':
    main()
