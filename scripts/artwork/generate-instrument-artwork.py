"""Render the reviewed instrument SVGs from banner masters and matching icon paths.

Run from the repository root:
  python3 scripts/artwork/generate-instrument-artwork.py [slug ...]          # write (all or listed)
  python3 scripts/artwork/generate-instrument-artwork.py --check [slug ...]  # exit 1 on drift
"""

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
ROOT = REPO / 'public'
INSTRUMENTS = {node['id'][len('instrument:'):]
               for node in json.loads((REPO / 'src/data/graph.json').read_text())['nodes']
               if node['type'] == 'instrument'}
OUTPUT = {}
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
    if name == 'madeiran-machete':
        return (path('M-28-16C-40-28-61-20-70-25C-97-43-126-30-126 0'
                     'C-126 30-97 43-70 25C-61 20-40 28-28 16Z', WOOD)
                + path('M-37-8L47-5V5L-37 8Z', DARK)
                + path('M47-6L74-11Q82 0 74 11L47 6Z', '#8d593a', GOLD)
                + rosette(-57, 9) + rect(-103, -9, 5, 18, DARK)
                + frets(-33, 47, 6, 'M{x} -6v12')
                + pegs([(x, y) for x in (56, 69) for y in (-13, 13)])
                + strings(-100, 69, 4, 2.8))
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
            # In the upright playing pose the crook turns toward the player,
            # with the reed continuing along the tip of the tube.
            + path('M22 11C32 10 34 17 43 19S55 20 61 30', stroke='#e3ebe8', w=2.5)
            + path('M60 30L63.5 36.5L66.5 34.7L62 29Z', '#efd19a')
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


def juno_60():
    sliders = ''.join(
        path(f'M{x}-29v18', stroke='#718697', w=.85)
        + rect(x-1.6, -26 + (i % 4) * 3, 3.2, 3, '#bfccd7', .45)
        for i, x in enumerate((-88, -79, -64, -55, -46, -30, -21, -12, 4, 13, 22, 35, 44, 53))
    )
    buttons = ''.join(rect(65 + i * 6, -12, 4, 4, '#d2d8e0', .45) for i in range(8))
    return (rect(-128, -40, 256, 83, '#253241', 3, '#afc4d3')
            + rect(-128, -40, 9, 83, '#906246', 2, '#c69668')
            + rect(119, -40, 9, 83, '#906246', 2, '#c69668')
            + path('M-117-2H117', stroke='#597f9a', w=1.8)
            + sliders + buttons + rect(68, -29, 13, 7, '#6e3d43', 1)
            + keyboard(-86, 5, 202, 32, 36)
            + rect(-115, 14, 21, 13, DARK, 1)
            + path('M-109 20h8', stroke='#b1c0c9', w=2))


def tamboo_bamboo():
    tubes = ''
    for x, top, width in ((-46, -59, 27), (-7, -38, 23), (29, -15, 19)):
        bottom = 51
        tubes += rect(x, top, width, bottom-top, '#9c7846', 3, '#e3be7f')
        tubes += ellipse(x + width / 2, top, width / 2, 4, '#352a23', '#dfb873')
        tubes += path(f'M{x+4} {top+8}V{bottom-3}', stroke='#c7a568', w=1.4)
        for node in range(top + 26, bottom - 7, 25):
            tubes += path(f'M{x+1} {node}q{width/2-1:g} 3 {width-2} 0', stroke='#5e4c31', w=2)
    return tubes + path('M55 44l23-63', stroke='#c99f61', w=4)


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


# Alto saxophone after a Yamaha YAS-62 photo: long conical body, tight bow and a bell tube that rises
# against the body (one shared seam) to a bell flaring out at mid-height.
SAXOPHONE_OUTLINE = (
    'M10.95 6C10.8 3.36 9.4 2.07 6.82 2.4L5.1 2.93 4 3.8l.87.64 2.05-.75'
    'C8.33 3.47 9.2 4.44 9.16 6.35l1.9 12.57A3.4 3.4 0 0 0 17.7 17.54l-.45-2.54'
    'Q17.8 13.7 20.1 13.4l-6.75-.8-.8-.15Z'
)
SAXOPHONE_SEAM = 'M13.35 12.6q.5.8.33 2.1l.8 3.35'


def saxophone():
    return ('<g transform="scale(6) translate(-12 -12)">'
            + path(SAXOPHONE_OUTLINE, WOOD, '#a7f3d0', .23)
            + path(SAXOPHONE_SEAM, stroke='#12382f', w=.34)
            + path('M5.1 2.93 4 3.8l.87.64 1.41-.48-.22-1.3Z', '#182730', '#8cd7c1', .15)
            + path('M6.11 2.66l.22 1.3', stroke='#8cd7c1', w=.22)
            + '<ellipse cx="16.73" cy="13" rx="3.42" ry=".72" transform="rotate(7 16.73 13)"'
              ' fill="#12382f" stroke="#a7f3d0" stroke-width=".3"/>'
            + path('M9.83 7.5l1.83 10', stroke='#a6d5c4', w=.22)
            + ''.join(f'<ellipse cx="{x}" cy="{y}" rx=".55" ry=".42" fill="#dcf7ea" stroke="#326c5e" stroke-width=".14"/>'
                      for x,y in [(10.57,8.65),(10.89,10.14),(11.2,11.63),(11.51,13.13),
                                  (11.82,14.62),(12.13,16.11)])
            + path('M11.9 18.9A2.6 2.6 0 0 0 16.9 17.7', stroke='#72c6aa', w=.26)
            + '</g>')


# Icon paths keep the banner's defining shapes and drop small controls and strings.
def oud():
    return (path('M8 0Q-15-27-52-40Q-108-65-129-21Q-149 28-99 46Q-64 58-19 28Q-2 17 8 0Z', WOOD)
            + path('M1-9L66-7V7L1 9Z', DARK)
            + path('M65-7Q81-21 100-37L108-29Q87-8 65 7Z', '#8d593a')
            + rosette(-67, 15) + ellipse(-35, -19, 6, 5, DARK, GOLD)
            + ellipse(-35, 19, 6, 5, DARK, GOLD)
            + rect(-106, -12, 5, 24, DARK)
            + ''.join(ellipse(x, y, 2.7, 2, GOLD) for x, y in
                      [(70,-3),(75,-8),(80,-13),(85,-18),(90,-23),(95,-28),
                       (76,1),(81,-4),(86,-9),(91,-14),(96,-19)])
            + strings(-103, 66, 11, 1.7))


def bouzouki():
    return (path('M-39 0Q-44-22-74-33Q-107-43-123-16Q-137 0-123 16Q-107 43-74 33Q-44 22-39 0Z', WOOD)
            + path('M-48-8L89-5V5L-48 8Z', DARK)
            + path('M89-6L115-9Q121 0 115 9L89 6Z', WOOD)
            + ellipse(-64, 0, 10, 8, DARK, GOLD)
            + path('M-93 9Q-80 22-64 12', stroke=DARK, w=3)
            + rect(-109, -9, 4, 18, DARK)
            + frets(-43, 88, 8, 'M{x} -6v12')
            + pegs([(x, y) for x in (95, 103, 111) for y in (-11, 11)])
            + strings(-107, 111, 6, 2))


def guembri():
    return (path('M-119-29Q-123-26-123-18V19Q-122 26-113 29H-36Q-27 27-25 20V-20Q-27-27-35-29Z', WOOD)
            + path('M-117-23H-34L-31 20H-117Z', '#d4ad80')
            + path('M-32-6L112-5Q122 0 112 5L-32 6Z', '#805337')
            + path('M-116-20v40m5-40v40', stroke='#8c6149')
            + rect(-94, -11, 4, 22, DARK)
            + pegs([(76, 9), (93, -9), (108, 9)])
            + strings(-92, 108, 3, 4))


def cajon():
    return (path('M-57-57L-36-69H63L40-57Z', '#b9704a')
            + path('M40-57L63-69V48L40 63Z', '#671d1d')
            + path('M-57-57H40V63H-57Z', WOOD)
            + path('M-51-51H34V57H-51Z', stroke=GOLD, w=.8)
            + ''.join(ellipse(x, y, 1.8, 1.8, DARK)
                      for x in (-48, 31) for y in (-48, -22, 28, 53))
            + path('M-31-37q-9 32 1 69m40-64q5 29-2 77', stroke='#a24e3b', w=.9))


def saron():
    bars = ''.join(path(f'M{x} -24h22l5 36h-26Z', 'url(#wood)', '#f3d5a5')
                   + path(f'M{x+2} -18l3 23', stroke=GOLD, w=.8)
                   for x in range(-87, 82, 27))
    return (path('M-116 5H112L102 34H-105Z', '#671d1d')
            + path('M-111 14H108V22H-109Z', '#a83935')
            + path('M-115 5L-99-29H94L112 5Z', DARK)
            + bars
            + path('M-100 24q10 12 20 0q10-12 20 0q10 12 20 0m80 0q10 12 20 0q10-12 20 0q10 12 20 0', stroke=GOLD)
            + path('M-10-40L64-53', stroke=GOLD, w=4)
            + path('M-20-47l16-2 3 14-16 2Z', '#b9704a'))








def erhu():
    body = (path('M-84-22l20-11 22 11v25l-22 12-20-12Z', WOOD)
            + path('M-84-22l20 11v26m0-26 22-11', stroke=GOLD, w=1.7)
            + path('M-63-9L81-6Q99-6 99-18', stroke=DARK, w=7)
            + path('M-63-9L81-6Q99-6 99-18', stroke=EDGE, w=1.5)
            + pegs(((73, 13), (86, 13)))
            + path('M-69-5L84-5', stroke=WIRE, w=.9)
            + path('M-100 25Q-38 14 38-18', stroke=GOLD, w=2.7)
            + path('M-100 25L38-18', stroke='#efc78e', w=1.25)
            + path('M-69 2L84 2', stroke=WIRE, w=1.05)
            + path('M-70-5v8', stroke=GOLD, w=2))
    return f'<g transform="rotate(-22)">{body}</g>'


def pipa():
    return (path('M-98-36Q-65-56-19-29L36-11L80-7Q100-10 102-20L115-17Q114-2 104 6L38 10L-19 29Q-61 56-98 36Q-121 23-121 0Q-121-23-98-36Z', WOOD)
            + path('M-104-17v34', stroke=DARK, w=6)
            + pegs(((65, -14), (77, 15), (90, -15), (103, 11)))
            + ''.join(path(f'M{x} {-h}v{h*2}', stroke=GOLD, w=2.4) for x, h in
                      [(-87, 17), (-69, 17), (-53, 16), (-38, 15), (-24, 14), (-11, 13),
                       (0, 12), (11, 11), (21, 10), (30, 9), (41, 9), (52, 9)])
            + strings(-104, 103, 4, 3))


def dizi():
    return (rect(-117, -7, 234, 14, WOOD, 2, EDGE)
            + ''.join(path(f'M{x}-7v14', stroke=GOLD, w=1.65) for x in
                      (-109, -76, -64, -30, -19, 39, 49, 88, 105))
            + ellipse(-86, 0, 3.7, 3.1, DARK)
            + ellipse(-54, 0, 3.8, 3.1, WIRE, DARK)
            + ''.join(ellipse(x, 0, 2.9, 2.9, DARK) for x in (-9, 6, 20, 34, 61, 78)))


def suona():
    return (path('M-82-4Q-76-10-62-8Q-53-2-44-8Q-37-11-27-7Q-19-2-11-8Q-4-11 5-6Q14-2 23-10L58-12V12L23 10Q14 2 5 6Q-4 11-11 8Q-19 2-27 7Q-37 11-44 8Q-53 2-62 8Q-76 10-82 4Z', WOOD)
            + path('M56-9C77-11 92-16 101-31V31C92 16 77 11 56 9Z', GOLD, EDGE)
            + ellipse(101, 0, 8, 31, '#54442d', GOLD)
            + path('M-115 0H-82m-13-8v16m-20-2v-12', stroke=GOLD, w=2.2)
            + ''.join(ellipse(x, 0, 2.6, 2.5, DARK) for x in (-69, -54, -39, -24, -9, 10, 27)))


def yueqin():
    return (ellipse(-62, 0, 44, 44, WOOD, EDGE)
            + ellipse(-62, 0, 40, 40, 'none', GOLD)
            + path('M-25-9H22L33-6H59L66-2V2L59 6H33L22 9H-25Z', WOOD)
            + path('M-89-13v26', stroke=DARK, w=5)
            + pegs(((40, -15), (53, -15), (40, 15), (53, 15)))
            + frets(-36, 30, 9, 'M{x}-8v16', 1.9)
            + ''.join(path(f'M-89 {y}L58 {y*.64:g}', stroke=WIRE, w=.7) for y in (-4.5,-3,3,4.5)))


def sheng():
    pipes = ''.join(
        rect(x, top, 6, 35-top, WOOD, 1, EDGE)
        + path(f'M{x} {top+4}h6', stroke=GOLD, w=1)
        + ellipse(x+3, 20, 1.1, 1.4, DARK)
        for x, top in [(-31,-32), (-25,-42), (-19,-48), (-13,-52), (-7,-47),
                       (-1,-37), (5,-31), (11,-28), (17,-34), (23,-44), (29,-40)])
    return (''.join(rect(x, top, 5, 35-top, '#266447', 1, GOLD)
                    for x,top in [(-35,-28),(-30,-36),(-21,-43),(12,-35),(21,-39),(34,-33)])
            + pipes + path('M-39 30Q-41 52-18 55H21Q43 52 40 30Z', WOOD)
            + ellipse(0, 31, 40, 6, '#4b9474', GOLD)
            + path('M-32 46Q-54 43-78 52L-82 44Q-56 32-35 36Z', GOLD, EDGE)
            + path('M-35 34H36M-30 47H29', stroke=GOLD, w=2))


def court_biwa():
    return (path('M22 0C6-21-27-39-64-40C-96-41-110-23-110 0S-96 41-64 40C-27 39 6 21 22 0Z', WOOD)
            + path('M-17-9L69-7L75 7L-17 10Z', DARK)
            + path('M67-7l15-19 18 6-20 19-5 8Z', WOOD)
            + path('M-98-11Q-76-18-58-13V13Q-76 18-98 11Z', '#805337')
            + path('M-66-23q-9 5 0 8m0 30q-9 5 0 8', stroke=DARK, w=2.3)
            + rect(-94, -11, 5, 22, DARK)
            + frets(6, 68, 15, 'M{x} -9v18', 2)
            + pegs([(74, -19), (83, -23), (81, 3), (90, -5)])
            + strings(-90, 71, 4, 2.8)
            + path('M40 43L75 21Q81 37 84 47Z', '#d9b591'))


def court_taiko():
    return (ellipse(0, -3, 65, 54, 'none', GOLD)
            + path('M-60 28v18h120V28M-49 48h98m-92-85 11 8m75-8-11 8', stroke=GOLD, w=3)
            + path('M-39-27Q0-38 41-25V25Q0 38-39 27Z', WOOD)
            + ellipse(28, 0, 22, 30, '#bf735c', EDGE)
            + path('M-12-55l-4 20m33-18-4 19', stroke=WIRE, w=2.4)
            + path('M-22-32H9M-23 32H9', stroke=GOLD, w=3)
            + ellipse(-9, 0, 37, 35, '#e1b893', EDGE)
            + ellipse(-9, 0, 30, 28, '#c68a73', GOLD)
            + ''.join(f'<g transform="rotate({angle} -9 0)">'+path('M-9-2c-10 3-14-8-8-12 7-5 16 3 13 9q-2 5-5 9 1-4 0-6Z','#78423d','none')+'</g>' for angle in (0,120,240))
            + path('M70 17l28-23M76 45l26-27', stroke=GOLD, w=3.7))


def sori_barrel():
    studs = ''.join(ellipse(x, y, 2, 2, GOLD) for x, y in (
        (-42,-24),(-26,-31),(-5,-31),(16,-29),(37,-24),(-42,24),(-26,31),(-5,31),(16,29),(37,24),
    ))
    return (path('M-48-28Q-2-43 56-29V29Q-2 43-48 28Z', WOOD)
            + path('M-39-23Q1-33 52-24M-39 23Q1 33 52 24', stroke=DARK, w=2.1)
            + ellipse(-48, 0, 15, 28, '#875349', EDGE)
            + ellipse(56, 0, 19, 29, '#e0b793', EDGE)
            + ellipse(57, 0, 14, 23, 'none', '#ad6c55')
            + studs
            + path('M4-40l61-12', stroke=GOLD, w=4.5))


def south_indian_veena():
    return (ellipse(68, 22, 24, 19, '#b18349', EDGE)
            + path('M-21-13Q-38-40-69-40Q-104-40-116-6Q-126 24-91 32Q-53 41-21 13Z', WOOD)
            + path('M-34-12L92-10V10L-34 12Z', DARK)
            + path('M86-12q14-10 27-2l9 7-7 7q-6-9-9 0l9 7-9 5-20-2Z', WOOD)
            + path('M-30 13H86M-32-13H86', stroke=GOLD, w=1.6)
            + frets(-28, 86, 6, 'M{x} -9v18', 1.6)
            + rect(-85, -11, 8, 22, GOLD)
            + path('M-103-10q13-16 37-13m-37 36q18 13 42 10', stroke=GOLD, w=1)
            + strings(-83, 90, 4, 3.0)
            + path('M-79 10L84 13M-79 13L84 16M-79 16L84 19', stroke=WIRE, w=.65))


def carnatic_barrel():
    straps = ''.join(path(f'M-75 {y:g}Q-8 {y*1.48:g} 67 {y*1.25:g}', stroke=GOLD, w=1.65)
                     for y in (-23, -16, -9, 0, 9, 16, 23))
    return (path('M-76-26C-37-38 12-43 65-34V34C12 43-37 38-76 26Z', WOOD)
            + ellipse(-76, 0, 12, 26, '#d0a37a', EDGE)
            + straps
            + ellipse(65, 0, 18, 34, '#dcba99', EDGE)
            + ellipse(66, 0, 13, 27, '#b28870', GOLD)
            + ellipse(70, 0, 7, 14, DARK, EDGE))


def punjabi_dhol():
    laces = ''.join(path(f'M-64 {y}L61 {y+7}L-64 {y+14}', stroke=GOLD, w=1.4)
                    for y in (-27,-13,1,15))
    return (path('M-68-31C-22-43 28-43 68-31V31C28 43-22 43-68 31Z', WOOD)
            + path('M-53-30Q-44-59-9-54Q25-48 47-32', stroke='#dc855c', w=4)
            + ellipse(-68, 0, 16, 31, '#d0a27c', EDGE)
            + laces
            + path('M-40-35v12m33-15v12m27-10v12m25-10v12', stroke='#bd6454', w=4)
            + ellipse(68, 0, 17, 31, '#c78a6f', EDGE)
            + ellipse(69, 0, 13, 26, 'none', GOLD)
            + path('M16 51l66-17m-93 17q-12 5-22-1l-17-11', stroke=GOLD, w=3.3))


def classical_sarangi():
    fine_pegs = ''.join(ellipse(x, 13+(i%2)*4, 2.3, 2.0, GOLD)
                       for i, x in enumerate(range(-15, 73, 5)))
    return (path('M-101-21Q-87-30-62-26L-52-17Q-44-12-34-23L-18-21L-12-17L-12 17L-18 21L-34 23Q-44 12-52 17L-62 26Q-87 30-101 21Q-109 0-101-21Z', WOOD)
            + path('M-102-19Q-75-23-55-14V14Q-73 23-102 19Z', '#cead91')
            + path('M-19-12L70-9V9L-19 12Z', DARK)
            + path('M63-14Q82-24 101-17L104 16Q84 22 63 13Z', WOOD)
            + fine_pegs
            + pegs([(75,-18), (89,-21), (97,18)])
            + rect(-78, -9, 4, 18, GOLD)
            + strings(-93, 97, 3, 3.2)
            + path('M-101 39Q-9 55 104 36M-101 39L104 36', stroke=GOLD, w=1.8))


def bonang_gong_chime():
    gongs = ''.join(ellipse(x, y, 13, 9, '#b58447', GOLD)
                   + ellipse(x, y-2, 4.8, 3.7, '#daad68', DARK)
                   for y, start in ((-21, -76), (5, -84))
                   for x in range(start, start+181, 30))
    return (path('M-114 16l13-54H103L114 16Z', DARK)
            + path('M-113 16H114L107 36H-106Z', '#823b38')
            + path('M-108 21H108M-106 33H107', stroke=GOLD, w=1.5)
            + path('M-104 34v9m207-9v9', stroke=GOLD, w=3)
            + path('M-101-10H103M-93-30H93M-107 12H106', stroke='#b26d58', w=4)
            + gongs
            + path('M-30-48l79 8m14-11 42 12', stroke=GOLD, w=2.8)
            + ellipse(-31, -48, 6, 3, '#95524c', EDGE)
            + ellipse(61, -52, 6, 3, '#95524c', EDGE))


def gamelan_rebab():
    return (path('M-114 0L101-5V5L-114 1Z', WOOD)
            + path('M-88 0Q-84-11-73-17L-50-31Q-36-38-35-20L-35 20Q-36 38-50 31L-73 17Q-84 11-88 0Z', '#ba957a')
            + path('M-83 0L-48-23V23Z', '#dac1a1', GOLD)
            + path('M-34 0L93-3V3L-34 1Z', DARK)
            + ellipse(98, 0, 9, 7, WOOD, EDGE)
            + pegs([(76,-16), (89,16)])
            + rect(-53, -7, 4, 14, DARK)
            + strings(-68, 94, 2, 2.3)
            + path('M-96 38Q-7 61 105 34M-96 38L105 34', stroke=GOLD, w=1.85))


def kora():
    # Two banks share one bridge. Keep the wire quieter than the wood silhouette.
    banks = ''.join(
        path(f'M{3 + side * 3} {-61 + index * 4.4:.1f}'
             f'L{16 + side * 6} {31 + index * .83:.2f}',
             stroke=('#e4bc8b', '#f5d8ae')[side], w=.47)
        for side, count in ((0, 11), (1, 10))
        for index in range(count)
    )
    return (ellipse(-5, 43, 38, 28, WOOD, EDGE)
            + ellipse(-1, 41, 34, 25, '#b78356', '#d9a977')
            + path('M-8 68L2-71Q7-76 11-70L1 69Z', WOOD, EDGE)
            + path('M2-55l8 1M1-40l8 1M0-25l8 1M-1-10l8 1', stroke='#a37651', w=2)
            + path('M-27 57l4-45M26 56l4-45', stroke=DARK, w=6)
            + path('M-27 56l4-44M26 55l4-44', stroke=GOLD, w=3)
            + path('M-2 46L14 29H23V39L6 51H-2Z', '#714730', EDGE)
            + banks
            + path('M17 40L-3 68M22 40L-1 68', stroke='#ca9a6e', w=.65))


def djembe():
    return (path('M-54-25Q-55 9-24 20L-35 43Q0 56 35 43L24 20Q55 9 54-25Z', WOOD)
            + ellipse(0, -26, 54, 15, '#debc8c', EDGE)
            + path('M-53-21Q0-1 53-21M-29 20Q0 31 29 20', stroke=DARK, w=3)
            + ''.join(path(f'M{x} {-14+abs(x)*-.15:g}L{x*.51:g} 22', stroke=WIRE, w=1.45)
                      for x in range(-48, 49, 12))
            + path('M-30 37Q0 49 30 37', stroke=GOLD))


def qanun():
    return (path('M-111 34H111V-38H-45Z', WOOD)
            + path('M80-34H105V30H80Z', '#c5a078')
            + path('M79-34V30M90-34V30', stroke=GOLD, w=3)
            + ''.join(path(f'M{-47-i*2.8:.1f} {-33+i*3}H99', stroke=WIRE, w=.62)
                      for i in range(21))
            + ellipse(38, 0, 10, 10, DARK, GOLD)
            + ellipse(16, 15, 5, 5, DARK, GOLD))


def reed_flute():
    return (path('M-106-9L106-6Q112 0 106 6L-106 9Z', WOOD)
            + ellipse(-107, 0, 4.6, 9, '#513d26', GOLD)
            + ellipse(-108, 0, 2.3, 6.1, DARK)
            + ellipse(107, 0, 2.5, 6, DARK, GOLD)
            + ''.join(ellipse(x, 0, 2.7, 2.65, DARK, GOLD) for x in (-27, -10, 7, 24, 41, 58))
            + path('M-79-8v16m32-15v14m37-14v14m38-13v12m38-12v12m35-12v12', stroke=GOLD, w=2))


def riqq():
    return (ellipse(0, 0, 56, 52, WOOD, EDGE)
            + ellipse(0, -2, 42, 39, '#ba855f', GOLD)
            + ''.join(f'<g transform="rotate({angle})">{ellipse(0, -47, 10, 4, GOLD, DARK)}'
                      f'{ellipse(0, -51, 10, 4, GOLD, DARK)}</g>' for angle in range(0, 360, 72))
            + ellipse(0, -2, 37, 34, 'none', EDGE))


def darbuka():
    return (path('M-39-42Q-40-13-17-1Q-16 15-28 43Q0 51 28 43Q16 15 17-1Q40-13 39-42Z', WOOD)
            + ellipse(0, -42, 39, 11, '#cfad8e', EDGE)
            + path('M-35-27Q0-16 35-27M-17 1Q0 9 17 1M-22 33Q0 43 22 33', stroke=GOLD, w=2.6)
            + path('M-25-18l10 8 15-5 15 5 10-8m-43 43 9-8 9 12 9-12 9 8', stroke=WIRE))


def santur():
    return (path('M-109 35H109L68-34H-68Z', WOOD)
            + ''.join(path(f'M{-73-i*5:g} {-28+i*7.2:g}H{73+i*5:g}', stroke=WIRE, w=.7)
                      for i in range(9))
            + ''.join(ellipse(x, y, 3.4, 2.6, GOLD, DARK)
                      for i in range(9) for y in [-28+i*7.2]
                      for x in [-23-i*2.5, 23+i*2.5])
            + path('M-91-37l63 23m119-24-63 23', stroke=GOLD, w=3.4))


def ravann():
    return (ellipse(0, 5, 65, 48, WOOD, EDGE)
            + ellipse(0, -2, 65, 47, '#b78365', GOLD)
            + ellipse(0, -2, 60, 41, '#dbb693', EDGE)
            + path('M-61 16Q0 89 61 16', stroke=DARK, w=2)
            + ''.join(ellipse(x, y, 2.2, 2.7, DARK) for x, y in
                      [(-50, 29), (-35, 39), (-18, 45), (0, 48), (18, 45), (35, 39), (50, 29)]))


def maravann():
    # The wooden side walls and cane face enclose the seeds.
    cane = []
    for index in range(39):
        x = -89 + index * 4.35
        top = -32 + index * .25
        length = 57 - index * .18
        lean = 6 + (index % 4) * .5
        tint = ('#e6b97e', '#c99059', '#f1ce9a', '#b77b4d')[index % 4]
        cane.append(path(f'M{x:.2f} {top:.2f}l{lean:.2f} {length:.2f}', stroke=tint, w=2.15))

    return (path('M-104-40L88-29L105 34L-86 41L-97 47L-113-33Z', WOOD)
            + path('M-104-40L-86 41L-97 47L-113-33Z', '#703b32', EDGE)
            + path('M-86 41L105 34L98 41L-97 47Z', '#854c38', EDGE)
            + path('M-94-33L81-23L95 28L-82 34Z', '#523329', GOLD)
            + ''.join(cane)
            + path('M-104-40L88-29L105 34L-86 41ZM-94-33L81-23L95 28L-82 34Z',
                   stroke=GOLD, w=1.75)
            + path('M-103-35l14 68m-3 11 181-7', stroke='#b87051', w=1.3))


def kayamb():
    reeds = ''.join(path(f'M{x} -26l9 52', stroke=GOLD, w=1.1)
                    for x in range(-97, 97, 7))
    return (path('M-109-26L-96 33H112L109 27H-97Z', '#815544', GOLD)
            + path('M-109-27H97L109 27H-97Z', WOOD)
            + reeds
            + path('M-109-27H97L109 27H-97Z', stroke=GOLD, w=3)
            + path('M-106-15H99M-102 14H106', stroke=DARK, w=3.5)
            + path('M-94 30H108', stroke='#d29067', w=1.5)
            + path('M-98-22h5m187 0h5m-185 44h5m187 0h5', stroke=WIRE, w=2))


def balafon():
    keys = ''.join(path(f'M{x} {-26+index:g}h9l1 {49-index*2}H{x-2}Z', WOOD)
                   for index, x in enumerate(range(-100, 101, 12)))
    gourds = ''.join(ellipse(x, 25, radius, radius*.85, '#b17a45', GOLD)
                     for x, radius in zip(range(-96, 97, 16), range(19, 6, -1)))
    return (path('M-114 26H112M-103 20v26m204-26v26', stroke=DARK, w=5)
            + gourds + keys + path('M-108-12H108M-108 12H108', stroke=GOLD, w=1.8)
            + path('M-73-45l65 19m49-19 52 15', stroke=WIRE, w=3)
            + ellipse(-73, -45, 6, 5, DARK, GOLD) + ellipse(41, -45, 6, 5, DARK, GOLD))


def sabar():
    return (path('M-32-39L-20 22L-25 45Q0 52 25 45L20 22L32-39Z', WOOD)
            + ellipse(0, -39, 32, 10, '#d5a887', EDGE)
            + ''.join(path(f'M{x} -32l{x*-.35:g} 42l{x*.13:g} 31', stroke=WIRE, w=1.5)
                      for x in (-28, -18, -8, 8, 18, 28))
            + ''.join(path(f'M{x} {y}l{-3 if x<0 else 3} 12', stroke=DARK, w=6)
                      + path(f'M{x} {y}l{-3 if x<0 else 3} 12', stroke=GOLD, w=3.6)
                      + ellipse(x+(-3 if x<0 else 3), y+12, 2.8, 2.4, '#aa7453', EDGE)
                      for x, y in ((-24,-18),(-12,-15),(0,-14),(12,-15),(24,-18)))
            + path('M43 27Q52 2 61-23', stroke=GOLD, w=3))


def tama():
    return (path('M-59-25C-27-24-23-10 0-9S28-25 59-25V25C28 25 23 10 0 9S-28 25-59 25Z', WOOD)
            + ellipse(-59, 0, 7, 25, '#c29074', EDGE)
            + ellipse(59, 0, 7, 25, '#c29074', EDGE)
            + ''.join(path(f'M-57 {y}H57', stroke=WIRE, w=1.3) for y in (-19, -12, -5, 5, 12, 19))
            + path('M15-21Q30-52 56-35', stroke=GOLD, w=3))


def rouler():
    return (path('M-74-20Q-12-31 64-27V27Q-11 25-74 19Z', WOOD)
            + ellipse(-74, 0, 14, 20, '#815544', EDGE)
            + ellipse(-76, 0, 10, 16, DARK, GOLD)
            + ellipse(64, 0, 14, 27, '#c79573', GOLD)
            + path('M-43-24v47m33-51v53m50-54v56', stroke=GOLD, w=2.8)
            + ''.join(path(f'M-65 {y}Q-6 {y*1.35:g} 59 {y*1.2:g}', stroke='#aa765c', w=1.15)
                      for y in (-16, -8, 0, 8, 16))
            + path('M-56-23v44m89-47v53', stroke='#624538', w=3))


def didgeridoo():
    return (path('M-115-7Q-68-8-33-5Q-15-2 5-6Q31-10 58-8L111-13Q119-11 119 0Q119 11 111 13L58 8Q31 10 5 6Q-15 3-33 5Q-68 8-115 7Z', WOOD)
            + ellipse(-115, 0, 3.7, 7, DARK, GOLD)
            + ellipse(113, 0, 5.5, 12, DARK, GOLD)
            + path('M-105-7v14m12-14v14m179-17v20', stroke=GOLD, w=1.6)
            + path('M-84 1Q-52-4-22 2T40 1T96 0', stroke=WIRE, w=1))


def yamaha_dx7():
    switches = ''.join(rect(x, -13 + row * 7, 9, 4, '#3eaa85', .3)
                       for row in range(2) for x in range(-35, 96, 12))
    return (rect(-109, -27, 218, 56, '#4d3740', 3, '#89ddc5')
            + panel_text(-101, -15, 'DX7', 8, '#9ccac0')
            + rect(-75, -15, 28, 8, '#a4b86f', .6)
            + switches + keyboard(-82, 2, 183, 24, 36)
            + rect(-103, 5, 6, 13, DARK) + rect(-93, 5, 6, 13, DARK))


def mellotron():
    return (path('M-78-34H75L85-25V30H-85V-25Z', '#c8996c', '#f3dfbf')
            + rect(-80, -28, 160, 15, '#e6d2af', 1)
            + panel_text(-73, -18, 'MELLOTRON', 6, DARK)
            + knobs((38, 52, 66), -21, 3)
            + keyboard(-70, -8, 140, 24, 21)
            + path('M-81 19H81M-77 28H77', stroke='#9a6842', w=2))


def fairlight_cmi():
    return (rect(-15, -49, 69, 45, '#7b8291', 4, '#d8dff0')
            + rect(-7, -43, 44, 28, '#282d40', 3, '#485b65')
            + path('M0-33q5-10 9 0t11 0 11 0', stroke='#8cebb4', w=1.2)
            + ellipse(46, -12, 2, 2, '#b8efb3')
            + rect(60, -42, 34, 42, '#adb3c1', 2, '#dee4ef')
            + path('M65-34h24m-24 8h24m-24 9h24', stroke='#3b4653', w=2)
            + rect(-99, 1, 181, 36, '#71604d', 3, '#e5cfad')
            + keyboard(-91, 8, 165, 25, 29)
            + rect(-73, -17, 55, 13, '#4c4d63', 2, '#e5daf3')
            + ''.join(path(f'M{x}-14v5', stroke='#e7dbef', w=1)
                      for x in range(-66, -20, 4))
            + path('M41-9l11 8', stroke='#ded3be', w=2.5))


def jupiter_8():
    slides = ''.join(path(f'M{x}-19v13m-2 {-6 + (i % 5) * 2}h4', stroke='#becbe1', w=1.05)
                     for i, x in enumerate(range(-33, 102, 6)))
    buttons = ''.join(rect(-30 + i * 9, -3, 7, 3, ['#c05c55', '#d39358', '#ddd778', '#88be78'][i // 3], .5)
                      for i in range(12))
    return (rect(-111, -30, 222, 60, '#334055', 3, '#93c9ee')
            + rect(-111, -29, 6, 58, '#b8c5d2') + rect(105, -29, 6, 58, '#b8c5d2')
            + panel_text(-102, -15, 'JUPITER-8', 8, '#f4d881')
            + slides + buttons + keyboard(-82, 4, 183, 22, 36)
            + rect(-101, 8, 10, 13, DARK) + path('M-96 9v7', stroke=GOLD, w=1.4))


def uilleann_pipes():
    return (path('M-41-26C-87-58-106-11-91 17Q-72 41-25 18L-13-2Q-18-16-41-26Z', '#684856')
            + path('M-50-28Q-72-36-84-15M-80 14Q-60 26-36 18', stroke='#b68b82', w=1.1)
            + path('M-39 3L78-12M-34 10L89 8M-41 15L75 22', stroke='#987050', w=6)
            + path('M-39 3L78-12M-34 10L89 8M-41 15L75 22', stroke=GOLD, w=1.35)
            + ''.join(rect(x - 2, y - 3, 4, 6, '#eee0af', 1) for x, y in
                      ((77, -12), (88, 8), (74, 22), (28, 9), (56, 8), (29, -6), (55, -9)))
            + path('M-28 5Q-22 22-8 31L18 49M-62-21Q-87-43-104-34', stroke='#a68068', w=4)
            + path('M-103-42h26v15h-26q-7-7 0-15Z', '#98684a')
            + ''.join(ellipse(x, y, 1.5, 1.5, DARK) for x, y in
                      ((-15, 26), (-9, 31), (-3, 35), (3, 39), (9, 43))))


def portuguese_guitar():
    return (path('M-39-8Q-58-13-71-28Q-104-39-114-12Q-124 16-104 29Q-84 38-64 23Q-50 11-39 8Z', WOOD)
            + path('M-53-7L75-4V4L-53 7Z', DARK)
            + path('M71-6Q96-7 104-21Q120 0 104 21Q94 8 71 6Z', WOOD)
            + rosette(-74, 11) + rect(-98, -9, 3, 18, DARK)
            + frets(-48, 75, 8, 'M{x} -5v10')
            + strings(-98, 99, 12, 1.1)
            + ''.join(ellipse(103 + i * .7, s * (6 + i * 2.2), 1.6, 1.6, GOLD)
                      for i in range(6) for s in (-1, 1)))


def cuban_tres():
    return (path('M-34-12Q-45-27-61-20Q-72-14-81-25Q-106-39-116-18Q-126 0-116 18Q-106 39-81 25Q-72 14-61 20Q-45 27-34 12Z', WOOD)
            + path('M-49-7L85-5V5L-49 7Z', DARK)
            + path('M84-6L111-9V9L84 6Z', WOOD)
            + rosette(-63, 10) + rect(-102, -10, 4, 20, DARK)
            + frets(-46, 85, 8, 'M{x} -5v10')
            + pegs([(x, y) for x in (90, 98, 106) for y in (-12, 12)])
            + ''.join(path(f'M-102 {y}L105 {y*.7:g}', stroke=WIRE, w=.68)
                      for y in (-6,-4,-1,1,4,6)))


def viola_da_gamba():
    body = (path('M-29-9Q-42-13-54-26Q-66-28-75-19Q-82-11-92-29Q-118-38-129-16Q-138 0-129 16Q-118 38-92 29Q-82 11-75 19Q-66 28-54 26Q-42 13-29 9Z', WOOD)
            + path('M-88-15q-7-3-4-9 2-4 7-3M-88 15q-7 3-4 9 2 4 7 3', stroke=DARK, w=2)
            + path('M-87-10L63-5V5L-87 10Z', DARK)
            + frets(-42, 62, 10, 'M{x} -6v12')
            + path('M62-7h17q10 0 10 6q0 6-8 7q-5-1-4-4q6 1 5-2l-20 5Z', WOOD)
            + pegs([(x, y) for x in (61, 68, 75) for y in (-11, 11)])
            + path('M-127-4l28-4v16l-28-4Z', DARK)
            + rect(-99, -11, 3, 22, GOLD) + strings(-126, 79, 6, 2.25)
            + path('M-103 42q81-8 169-3m-168 3 168-3', stroke=GOLD, w=1.5))
    return f'<g transform="translate(13 0) scale(.86) rotate(-13)">{body}</g>'


def celesta():
    return (path('M-83-44H77L83-34V26H-83Z', '#71505b', '#b8bcf8')
            + rect(-78, -39, 153, 38, '#8c6974', 1, '#b5afdc')
            + rect(-68, -33, 133, 23, '#795864', 1, '#a98db8')
            + keyboard(-75, 1, 149, 17, 29)
            + rect(-77, 21, 154, 5, '#694656', 1)
            + path('M-73 26v19m146-19v19M-64 42H64', stroke='#a6818a', w=4)
            + path('M4 26v16q6 4 14 1', stroke=GOLD, w=3.1))


def puerto_rican_cuatro():
    return (path('M-29-7Q-41-8-45-19Q-53-25-63-21L-68-15Q-76-10-81-19L-84-27Q-112-40-124-15Q-132 0-124 15Q-112 40-84 27L-81 19Q-76 10-68 15L-63 21Q-53 25-45 19Q-41 8-29 7Z', WOOD)
            + path('M-44-7L71-5V5L-44 7Z', DARK)
            + path('M70-5h38v10H70Z', WOOD)
            + rosette(-66, 9) + rect(-107, -8, 4, 16, DARK)
            + frets(-43, 69, 7, 'M{x} -5v10')
            + pegs([(x, y) for x in (76, 83, 90, 97, 104) for y in (-9, 9)])
            + strings(-106, 105, 10, 1.13))


def marimbula():
    return (path('M-83-26L-60-42H80L91-25V34H-83Z', WOOD)
            + path('M-83-26L-60-42H80L91-25H-83Z', '#b08255')
            + path('M75-25H91V34H75Z', '#6f4b3e')
            + ellipse(-6, 7, 20, 19, DARK, GOLD)
            + rect(-57, -14, 107, 7, '#a68a6b', 1, '#ecceaa')
            + ''.join(path(f'M{x} -13v{15 + i % 4 * 2}', stroke='#b8becb', w=3)
                      for i, x in enumerate(range(-48, 47, 13)))
            + path('M-77 29H69', stroke='#bb8d64', w=1.1))


def hammered_dulcimer():
    courses = ''.join(path(f'M{-73-i*3} {-23+5*i}H{73+i*3}', stroke=WIRE, w=.7)
                      for i in range(11))
    return (path('M-73-28H73L109 35H-109Z', WOOD)
            + path('M-70-22H70L100 30H-100Z', '#6d4e42', GOLD)
            + ellipse(-54, 4, 8, 7, DARK) + ellipse(53, 4, 8, 7, DARK)
            + path('M-22-24l-14 55M28-24l14 55', stroke=GOLD, w=3)
            + courses
            + path('M-63-37l40-10m-44 9q-3 7 5 7M32-44l41 10m-3 0q1 7 8 5', stroke=GOLD, w=2.1))


def cuica():
    return (path('M-60-35H30Q55-35 55 0T30 35H-60Z', '#7a5b66', '#e9adab')
            + ellipse(-60, 0, 14, 35, '#e3c7a5', '#f9e2c1')
            + ellipse(32, 0, 24, 35, '#393145', '#ecb2ae')
            + ellipse(33, 1, 19, 29, '#1e1828', '#9d787e')
            + path('M25-22Q17-6 25 18', stroke='#76524c', w=2)
            + path('M-60-28H31M-59 28H31', stroke='#d4c5bd', w=1.2)
            + ellipse(24, -1, 4, 5, '#8f624a', GOLD)
            + path('M24-1L49 8', stroke=DARK, w=5)
            + path('M24-1L49 8', stroke=GOLD, w=2.8)
            + ''.join(rect(x, y, 9, 3, '#d8c5b5', 1) for x in (-50, 17) for y in (-24, 23)))


def bass_drum():
    return (path('M-58-39H57Q81-36 82 0Q81 36 57 39H-58Z', WOOD)
            + path('M-52-35l22 69 23-69 23 69 23-69 19 69', stroke='#ead2ae', w=2.1)
            + ellipse(57, 0, 24, 39, 'none', '#b8826d')
            + ellipse(-58, 0, 27, 39, '#926251', '#f2c4a6')
            + ellipse(-58, 0, 21, 34, '#e5c29d', '#ac7d65')
            + path('M13-41l69-5', stroke='#c8a084', w=3.4)
            + ellipse(88, -47, 12, 8, '#e5d5bd', '#c39983'))


def dominican_tambora():
    return (path('M-46-30Q0-44 46-30V30Q0 44-46 30Z', WOOD)
            + ellipse(46, 0, 16, 31, '#c99b7c', '#f1c3a4')
            + path('M-44-31Q0-38 44-31M-44 31Q0 38 44 31', stroke=GOLD, w=2.7)
            + path('M-45-27L-21 29L-2-29L20 29L42-27', stroke='#fcdfae', w=2.6)
            + ellipse(-49, 0, 16, 30, '#966c59', '#f6c6a5')
            + ellipse(-49, 0, 12, 26, '#dcb696', '#a87c66')
            + ''.join(ellipse(x,y,2.7,2.6,GOLD,DARK) for x,y in [(-43,-28),(-21,29),(-2,-29),(20,29),(42,-27)])
            + path('M16-39l51-9', stroke='#f2c492', w=3))


def brass_tube(d, width, highlight=1):
    return (path(d, stroke='#503616', w=width+2)
            + path(d, stroke='#bf8638', w=width)
            + path(d, stroke='#f6cb79', w=max(1, width-3))
            + path(d, stroke='#ffebaf', w=highlight))


def brass_mouthpiece(x, y):
    return (path(f'M{x} {y-5}h3l5 3h6v4h-6l-5 3h-3Z', '#d9c5a6', '#fff0cc', .9)
            + ellipse(x, y, 1.8, 5, '#836747', '#fff0cc'))


def brass_pistons(xs, y, height):
    return ''.join(rect(x-4.5,y,9,height,'url(#wood)',1.8,EDGE)
                   + rect(x-5.5,y-1,11,3,GOLD,1,EDGE)
                   + rect(x-1,y-9,2,8,'#c0ab8a',.5)
                   + ellipse(x,y-10,5.6,1.8,'#d7c4a4',EDGE)
                   + rect(x-5,y+height-2,10,3,GOLD,1)
                   for x in xs)


def straight_trombone():
    return (brass_tube('M-75-6H-95Q-109-6-109 1Q-109 8-95 8H-72', 9)
            + path('M-86-9C-40-9 5-6 36-10Q57-13 68-26V14Q56 1 31-2C-9-5-42-2-86-2Z', WOOD)
            + ellipse(68,-6,3.6,20,'#654722',GOLD)
            + brass_tube('M-76 8H104C121 8 121 24 104 24H-80', 4.8)
            + brass_tube('M-77 7v18M-63 7v18M-84-5v13', 3)
            + path('M-60 6H-7M-60 22H-7', stroke='#fff1cf', w=1.35)
            + brass_mouthpiece(-96,24))


def piston_trumpet():
    return (brass_tube('M-96-13H58C87-13 88 12 62 12H-39Q-56 12-56 0', 6)
            + brass_tube('M-33 14V28Q-33 38-23 38H-2Q8 38 8 28V13', 5.8)
            + brass_tube('M-7-3H22Q42-3 42 7Q42 18 22 18H-7', 6)
            + brass_pistons((-28,-13,2), -16, 43)
            + path('M-46-2C0-2 37-1 65-4Q93-7 110-24V24Q93 7 66 4C32 1-9 4-46 4Z', WOOD)
            + ellipse(110,0,4.3,24,'#775022',GOLD)
            + brass_mouthpiece(-108,-13))


def single_f_horn():
    return (brass_tube('M-55-49H-26C16-52 47-27 47 7C47 35 27 53-5 53C-38 53-55 34-53 8C-52-13-37-30-21-33', 6)
            + brass_tube('M-15-30C-44-21-47 13-28 30C-13 44 19 41 27 20C38-4 21-29 2-29Z', 6)
            + brass_tube('M-22-7C-35-12-35 11-22 11H8Q20 10 17-1Q14-10 3-9Z', 5.5)
            + brass_tube('M-21 4C-32 10-32 24-21 28H10Q21 27 22 15Q22 6 12 5Z', 5.5)
            + brass_tube('M-19-17H9Q23-18 22-9M-14 19Q-20 38 0 37H15', 4)
            + ''.join(ellipse(x,-10,5.7,5.7,WOOD,EDGE) + path(f'M{x} -10l3-12h6',stroke=GOLD,w=2)
                      for x in (-22,-10,2))
            + path('M18 33C47 29 61 23 77 13L91 4L99 44L83 43C63 39 47 40 18 40Z', WOOD)
            + '<g transform="rotate(-11 94 24)">'+ellipse(94,24,6.2,21,'#755022',GOLD)+'</g>'
            + brass_mouthpiece(-68,-49))


def upright_bass_brass(is_tuba):
    # Both examples have four top-action pistons. The tuba has a wider bell,
    # heavier outer bow, and broader wrap than the euphonium.
    if is_tuba:
        bell = 'M-72-60H-8C-29-45-31-26-27 3L-22 26C-20 42-4 44 11 44H30Q51 44 51 24V-10H64V27Q64 58 31 58H4Q-37 58-39 29L-43 1C-45-25-49-47-72-60Z'
        lip = (-40,-60,32)
        outer = 'M-23 38C-26 13-29-28-8-32L29-32Q41-32 41-20V31Q40 45 26 45H4Q-10 45-11 29L-14-10'
        inner = 'M-17 13V30Q-17 39-8 39H28Q39 39 39 27V9M-14 19H7Q16 19 16 11V-9M57-10Q57-21 45-21H29Q19-21 19-13V3'
        lead = 'M65-46H55Q42-46 36-33L22-9H8'
        valves = (-14,-3,8,19)
    else:
        bell = 'M-51-61H3C-16-46-18-29-16-4L-13 24Q-12 37 2 37H20Q34 37 35 21V-6H44V22Q44 50 20 50H1Q-25 50-25 25L-27-4Q-28-44-51-61Z'
        lip = (-24,-61,27)
        outer = 'M-11 33V-8Q-11-28 3-28H18Q31-28 31-12V26Q31 37 19 37H4Q-3 37-3 27V3'
        inner = 'M-14 13H11Q20 13 20 22Q20 31 11 31H-5M13 14V29Q13 41 21 41Q29 41 29 31V10M40-6Q40-17 27-17H21Q13-17 13-10V3'
        lead = 'M54-46H45Q31-46 26-35L16-13Q13-8 2-8'
        valves = (-14,-5,4,13)
    x, y, r = lip
    mouth = 65 if is_tuba else 54
    return (path(bell, WOOD)
            + ellipse(x,y,r,4.3,'#62451f',GOLD)
            + brass_tube(outer, 8 if is_tuba else 5.8)
            + brass_tube(inner, 5.6 if is_tuba else 4)
            + f'<g transform="translate({mouth+13} 0) scale(-1 1)">'
            + brass_mouthpiece(0, -46)
            + '</g>'
            + brass_tube(lead, 4.4)
            + brass_pistons(valves,-14,31))


def cornet():
    return (brass_tube('M-76-12H38Q57-12 57 5Q57 24 38 24H-46Q-67 24-67 8Q-67-4-51-4H16', 6.5)
            + brass_tube('M-47 14V29Q-47 39-37 39H-10Q0 39 0 29V12', 6)
            + brass_tube('M-1 12H23Q36 12 36 20Q36 31 23 31H3', 5)
            + brass_pistons((-38,-23,-8), -16, 38)
            + path('M-29-2C19-2 42-1 64-7Q76-10 88-21V21Q72 9 60 6C39 2 12 4-29 4Z', WOOD)
            + ellipse(88,0,4.2,21,'#765020',GOLD)
            + brass_mouthpiece(-89,-12))


def flugelhorn():
    return (brass_tube('M-81-17H36Q63-17 63 7V16Q63 39 38 39H-42Q-70 39-70 14V-4', 8)
            + brass_tube('M-61 21Q-58 31-44 31H-6Q10 31 10 15V-3', 6)
            + brass_tube('M-8 18H15Q28 18 28 28H45', 5)
            + brass_pistons((-48,-33,-18), -19, 41)
            + path('M-30-4C13-4 34-7 53-13Q76-21 91-34V30Q72 17 51 12C31 7 3 4-30 4Z', WOOD)
            + ellipse(91,-2,6,32,'#765020',GOLD)
            + brass_mouthpiece(-94,-17))


def sousaphone():
    return (brass_tube('M-34-44C-57-35-70-14-64 11C-57 39-32 56-5 53C22 50 43 31 47 9C52-16 35-34 13-41', 12, 1.8)
            + path('M17-35Q31-58 46-59Q65-62 86-64L104-27Q80-19 60-28Q46-35 28-20Z', WOOD)
            + '<g transform="rotate(-29 93 -44)">'+ellipse(93,-44,8,22,'#735022',GOLD)+'</g>'
            + brass_tube('M-40-34H-21Q-13-34-12-25L-8-13', 4.5)
            + brass_tube('M-35 1v16q0 12 11 12h17q10 0 10-12V-2M-24 4v9q0 8 7 8h7', 4.5)
            + brass_pistons((-32,-21,-10), -14, 30)
            + brass_mouthpiece(-53,-34))


def helicon():
    return (brass_tube('M-37-23C-55-17-65-3-64 15C-62 43-32 60 4 55'
                       'C35 50 53 25 53 5C53-11 44-24 32-28', 10, 1.8)
            + brass_tube('M-48-27H-23Q-15-27-15-15V-6', 4.5)
            + brass_tube('M-36 3V18Q-36 30-23 30H17Q32 30 32 17V-23', 6)
            + brass_tube('M-26 9V16Q-26 21-18 21H-14Q-10 21-10 13V8', 3.8)
            + brass_pistons((-34,-22,-10), -10, 28)
            + path('M24-29Q49-30 60-41L77-24Q65-13 43-16Q33-17 24-18Z', WOOD)
            + '<g transform="rotate(-41 70 -32)">'+ellipse(70,-32,5,12,'#735022',GOLD)+'</g>'
            + brass_mouthpiece(-55,-27))


def cornetto():
    return (path('M-102-21C-33-22 28-12 87 12L101 17L96 32C41 6-31-11-102-13Z', '#734c32', '#f0c982')
            + path('M-95-17Q8-17 94 24', stroke='#dfa962', w=1.65)
            + ''.join(ellipse(x,y,3,2.6,'#2b1d17','#dba75f')
                      for x,y in [(-57,-15),(-36,-14),(-15,-11),(7,-7),(29,-2),(51,5)])
            + '<g transform="rotate(23 98 24)">'+ellipse(98,24,3.3,7.7,'#302016',GOLD)+'</g>'
            + brass_mouthpiece(-115,-17))


def natural_trumpet():
    return (brass_tube('M-127-10H94Q105-10 105 0Q105 10 94 10H-96Q-108 10-108 0Q-108-10-97-10H-57', 4.5)
            + brass_tube('M-68-9V9M21-9V9', 2.8)
            + path('M-61-13C18-13 63-12 90-16Q109-19 122-28V8Q109-2 91-4C55-7 6-7-61-7Z', WOOD)
            + ellipse(122,-10,4,18,'#745123',GOLD)
            + brass_mouthpiece(-139,-10))


ART = {
    'helicon': (lambda _: helicon(), 1.18, 'M4 7h4m4 0C7 3 2 8 3 14c1 6 8 8 12 4 2-2 3-6 1-8m-2 1c2 0 5 0 7-2l-3-5c-1 2-3 3-6 3M7 10v5m3-5v5'),
    'madeiran-machete': (plucked, 1.28, 'M11 10V4L10 2h4l-1 2v6c2-1 4 0 3 2l-.5 2c0 1 2.5 2 2.5 4 0 4-12 4-12 0 0-2 2.5-3 2.5-4L8 12c-1-2 1-3 3-2ZM12 15h.01M10 18h4'),
    'juno-60': (lambda _: juno_60(), 1.05, 'M2 7h20v10H2zM2 12h20M7 12v5m3-5v5m3-5v5m3-5v5m3-5v5M5 9v1m4-1v1m4-1v1m4-1h2'),
    'tamboo-bamboo': (lambda _: tamboo_bamboo(), 1.13, 'M3 4q2-2 4 0v16H3ZM3 5h4m-4 6h4m-4 5h4M10 7q2-2 4 0v13h-4Zm0 1h4m-4 7h4m3-3q1.5-2 3 0v8h-3Zm0 1h3m.5-4 1.5-4'),
    'cornet': (lambda _: cornet(), 1.29, 'M2 9h4m0 0h10q3-1 5-4v11q-3-4-7-4H7q-3 0-3 3t3 3h7q4 0 4-3M7 7v11m3-11v11m3-11v8'),
    'flugelhorn': (lambda _: flugelhorn(), 1.22, 'M2 8h5m0 0h7q4-1 8-5v13q-4-4-9-4H6q-2 0-2 3v2q0 3 3 3h9q4 0 4-4M7 6v11m3-11v11m3-11v10'),
    'sousaphone': (lambda _: sousaphone(), 1.1, 'M4 7h4m-2 0a8 8 0 1 0 10 1m-2 3 2-7 5-2 1 7-6 2m-9 0v5m3-5v5'),
    'cornetto': (lambda _: cornetto(), 1.1, 'M3 6q8 0 19 8l-2 3Q12 10 3 9Zm4 2h.01m3 1h.01m3 1h.01m3 2h.01m3 1h.01'),
    'natural-trumpet': (lambda _: natural_trumpet(), 1.1, 'M2 9h13q4 0 7-4v9q-3-3-7-3H5q-3 0-3 3t3 3h16M8 11v6m7-6v6'),
    'trombone': (lambda _: straight_trombone(), 1.19, 'M2 8h7q4 0 7-3v6q-4-2-7-2H5q-3 0-3 3t3 3h15q2 0 2 2t-2 2H3m2-4v4m3-4v4'),
    'trumpet': (lambda _: piston_trumpet(), 1.28, 'M2 9h4m0 0h8q6 0 7-4v13q-4-5-9-5H5q-2 0-2 2t2 2h10m-9-9v9m3-9v9m3-9v9M5 6h2m1 0h2m1 0h2'),
    'french-horn': (lambda _: single_f_horn(), 1.25, 'M2 4h5q8-1 9 6 1 7-5 9-6 2-8-4-1-5 4-7 5-2 6 3 1 4-3 5m4 2 8-4v7Zm-8-7h1m1 0h1m1 0h1'),
    'tuba': (lambda _: upright_bass_brass(True), 1.07, 'M2 2h11q-4 4-4 9v6q0 2 3 2h4q3 0 3-3V7m2 0h-3m-5 3v5m2-5v5m2-5v5m-5 7H8q-4 0-4-4V9q0-4-2-7Z'),
    'euphonium': (lambda _: upright_bass_brass(False), 1.11, 'M4 2h9q-3 3-3 8v7q0 2 2 2 4 0 4-3V9q0-4 5-4m-9 4v5m2-5v5m-2 8H9q-3 0-3-4V9q0-4-2-7Z'),
    'yamaha-dx7': (lambda _: yamaha_dx7(), 1.22, 'M2 7h20v10H2zm2 2h5m4 0h2m2 0h2M5 12h15m-12 0v5m4-5v5m4-5v5'),
    'mellotron': (lambda _: mellotron(), 1.32, 'M4 6h16l2 3v11H2V9zm0 4h16M5 13h14v4H5zm4 0v4m3-4v4m3-4v4'),
    'fairlight-cmi': (lambda _: fairlight_cmi(), 1.28, 'M8 3h10v8H8zm2 2h6v4h-6zm-8 9h20v7H2zm3 3v4m4-4v4m4-4v4m4-4v4'),
    'jupiter-8': (lambda _: jupiter_8(), 1.20, 'M2 6h20v12H2zm4 2v3m3-3v3m3-3v3m3-3v3m3-3v3M4 13h16m-12 0v5m4-5v5m4-5v5'),
    'uilleann-pipes': (lambda _: uilleann_pipes(), 1.33, 'M8 9C4 4 2 9 3 14c1 6 6 6 9 2l7 5M9 10l11-4m-9 7 10-1m-10 4 10 2M7 8l-2-4'),
    'portuguese-guitar': (lambda _: portuguese_guitar(), 1.20, 'M11 11l7-7 2-2 2 2-2 3-7 7c1 4-2 8-6 8-5 0-7-6-3-9 2-2 4-2 7-2zm-4 4h.01m-2 3 3 3'),
    'cuban-tres': (lambda _: cuban_tres(), 1.22, 'M10 11 18 3l3 3-8 8c0 4-2 7-6 7s-5-2-5-5 4-5 8-5Zm-4 5 2 2m3-5 2 2m4-9 2 2'),
    'viola-da-gamba': (lambda _: viola_da_gamba(), 1.12, 'M11 9V3h3v6q5 0 4 4l-2 2 2 3q0 4-6 4t-6-4l2-3-2-2q-1-4 5-4Zm0 2h3m-3 2h3m-4 4h4M21 4v16'),
    'celesta': (lambda _: celesta(), 1.38, 'M3 4h18v13H3zm1 8h16m-12 0v5m4-5v5m4-5v5M5 17v5m14-5v5m-7-5v4h3'),
    'puerto-rican-cuatro': (lambda _: puerto_rican_cuatro(), 1.22, 'M11 10l8-8 3 3-9 8q3 3-2 4-1 5-5 5-5 0-4-5 0-3 4-4 0-4 5-3zm-3 5h.01m-3 3 3 2'),
    'marimbula': (lambda _: marimbula(), 1.39, 'M3 8l4-4h14v16H3zm0 0h18M8 11h8m-7 0v4m3-4v6m3-6v4'),
    'hammered-dulcimer': (lambda _: hammered_dulcimer(), 1.24, 'M5 8h14l3 12H2zm0 4h14M4 16h16M9 9l-1 10m6-10 2 10M5 5l5-2m4 0 5 2'),
    'cuica': (lambda _: cuica(), 1.42, 'M6 5h11v14H6q-4 0-4-7t4-7Zm11 0c7 0 7 14 0 14-5 0-5-14 0-14Zm-1 6 4 2'),
    'bass-drum': (lambda _: bass_drum(), 1.18, 'M5 7h10c5 0 5 14 0 14H5m0-14C1 7 1 21 5 21s4-14 0-14ZM10 9l3 9 3-9m-8-3 10-3m3 0a2 2 0 1 1-4 0 2 2 0 1 1 4 0'),
    'dominican-tambora': (lambda _: dominican_tambora(), 1.22, 'M5 7q7-3 13 0v12q-7 3-13 0Zm0 0c-4 0-4 12 0 12m13-12c5 0 5 12 0 12M8 8l3 10 3-10 3 10m-4-13 8-3'),
    'kora': (lambda _: kora(), .97, 'M10 14l1-12h2l-1 12 5-5-1 7c2 4 0 6-4 6s-7-2-7-5q0-3 5-3Zm-2 4v-5m7 6 2-5'),
    'djembe': (lambda _: djembe(), 1.38, 'M4 7c0-4 16-4 16 0s-16 4-16 0Zm0 0c0 5 3 7 5 8l-2 5q5 2 10 0l-2-5c2-1 5-3 5-8M8 11l2 3m6-3-2 3'),
    'qanun': (lambda _: qanun(), 1.16, 'M3 19 9 5h12v14ZM10 9h7M8 13h9M6 16h11m1-11v14'),
    'ney': (lambda _: reed_flute(), 1.25, 'M3 8.5 21 12v3L3 12.5q-2-2 0-4Zm4 1v3m3-1h.01m3 1h.01m3 0h.01m3 1h.01'),
    'riqq': (lambda _: riqq(), 1.27, 'M19 12a7 7 0 1 1-14 0 7 7 0 1 1 14 0ZM12 2v3m9 4-3 1m0 10-2-2m-8 0-2 2M3 9l3 1'),
    'darbuka': (lambda _: darbuka(), 1.40, 'M5 5c0-3 14-3 14 0s-14 3-14 0Zm0 0c0 4 2 6 5 8 0 3-1 5-2 7q4 2 8 0c-1-2-2-4-2-7 3-2 5-4 5-8M10 14h4'),
    'santur': (lambda _: santur(), 1.21, 'M3 19 7 7h10l4 12ZM7 15h10M9 12h6M2 5l7 4m13-4-7 4'),
    'ravann': (lambda _: ravann(), 1.32, 'M21 10a9 6 0 1 1-18 0 9 6 0 1 1 18 0Zm0 0v3a9 6 0 0 1-18 0v-3M7 17v1m5 1v1m5-3v1'),
    'maravann': (lambda _: maravann(), 1.15,
                 'M2.5 6.5h17l2 10.5h-17zM2.5 6.5l-1 2 2 10.5h17l1-2'
                 'M7 9l1 5.5m3-5.5 1 5.5m3-5.5 1 5.5'),
    'kayamb': (lambda _: kayamb(), 1.31, 'M2 7h18l2 8H4Zm2 8v3h18v-3M6 7l2 8m3-8 2 8m3-8 2 8M3 11h18'),
    'balafon': (lambda _: balafon(), 1.18, 'M3 9h18v7H3zM6 9v7m4-7v7m4-7v7m4-7v7M5 16v3h3v-3m3 0v4h3v-4m3 0v3h3v-3M4 5l7 3m9-3-5 3'),
    'sabar': (lambda _: sabar(), 1.40, 'M5 5q6-4 12 0v1q-6 3-12 0Zm0 1 3 14q3 2 6 0l3-14M5 9l3 3m3-3v4m6-4-3 3m7-8-2 15'),
    'tama': (lambda _: tama(), 1.4, 'M3 7q5 0 9 3 4-3 9-3v10q-5 0-9-3-4 3-9 3zM3 12h18M12 7q3-4 8-4'),
    'rouler': (lambda _: rouler(), 1.30, 'M5 7q7-2 13 0v11q-7 2-13 0Zm0 0c-4 0-4 11 0 11m13-11c5 0 5 11 0 11M8 7v11m7-11v11'),
    'didgeridoo': (lambda _: didgeridoo(), 1.24, 'M2 14q7-2 10-2t9-4v6q-4 1-9 1T2 17zM4 14v2m15-7v5'),
    'biwa': (lambda _: court_biwa(), 1.12, 'M12 9V6l3-4 3 2-3 4v2c4 2 7 5 6 8-1 4-11 5-13 0-1-3 1-7 4-9Zm-1 7h6m-4-5 3 1M4 13l3 5-5 1z'),
    'taiko': (lambda _: court_taiko(), 1.23, 'M12 2a10 9 0 0 0-8 14l-1 4h18l-1-4a10 9 0 0 0-8-14Zm6 8a6 6 0 1 1-12 0 6 6 0 1 1 12 0Zm-6-5v1m0 8v1M6 22h12'),
    'soribuk': (lambda _: sori_barrel(), 1.17, 'M3 9q8-3 14 0v9q-8 3-14 0zM17 9q5 0 5 4.5T17 18M6 10v1m4-1v1m4-1v1M6 16v1m4-1v1m4-1v1M6 5l10-2'),
    'saraswati-veena': (lambda _: south_indian_veena(), 1.04, 'M10 13V4l2-2h4v3h-3v8a6 5 0 1 1-3 0Zm0-5h3m-3 3h3m-3 7h3m0-11c6-2 7 4 0 4'),
    'mridangam': (lambda _: carnatic_barrel(), 1.23, 'M3 9q7-4 14-2v11q-7 2-14-2ZM17 7q5 0 5 5.5T17 18m2-8v5M5 11l10-2m-10 4 10 1'),
    'dhol': (lambda _: punjabi_dhol(), 1.18, 'M3 8q7-3 14-1v12q-7 2-14-1ZM17 7q4 0 4 6t-4 6M5 9l10 4-10 4m6-11 2-3 6 1M8 22l14-2'),
    'sarangi': (lambda _: classical_sarangi(), 1.19, 'M9 11V3h6v8l2 1-1 3 2 4-1 2H7l-1-2 2-4-1-3Zm0 5h6m-4-11h4m-4 3h4M21 6v13'),
    'bonang': (lambda _: bonang_gong_chime(), 1.13, 'M3 8h18l1 10H2zM4 13h16M6 10h.01m6 0h.01m6 0h.01M6 15.5h.01m6 0h.01m6 0h.01M6 5l10-2'),
    'javanese-rebab': (lambda _: gamelan_rebab(), 1.15, 'M11 13V4l1-2 1 2v9l4 2-5 5-5-5Zm1 7v2M8 5h3m2 3h3m3-3q3 7 0 14'),
    'erhu': (lambda _: erhu(), .99, 'M8 17 19 3q1-2 3-1M17 6l3 1m-4 2 3 1M4 16l3-2 3 2v4l-3 2-3-2zM7 16v6m-4-9 16 6'),
    'pipa': (lambda _: pipa(), 1.20, 'M10 9 13 4q1-3 4-2l-.5 2.5L14 10c5 4 4 11-2 12-6 1-9-5-5-10zM9 13l6 3m-7 1 5 2m0-11 2 1'),
    'dizi': (lambda _: dizi(), 1.23, 'M2 10h20v4H2zM5 10v4m3-4v4m3-2h.01m3 0h.01m3 0h.01m3-2v4'),
    'suona': (lambda _: suona(), 1.24, 'M4 10 14 9q4 0 7-4v14q-3-4-7-4L4 14zM2 12h2m4 0h.01m3 0h.01m3 0h.01m7-7q3 7 0 14'),
    'yueqin': (lambda _: yueqin(), 1.22, 'M12 9l5-6 3 2-4 6a6.5 6.5 0 1 1-4-2Zm4-2 3 2m-12 7 3 2'),
    'sheng': (lambda _: sheng(), 1.26, 'M7 16V7h3v9m0-9V3h3v13m0-11h3v11m0-8h3v8M6 16h14q0 6-7 6T6 16Zm0 2-4 1'),
    'oud': (lambda _: oud(), 1.06, 'M12 8l5-4 3-2 2 2-2 3-2-1-4 5c0 5-4 10-8 9-3-.5-4-3-3-6 1-4 5-7 9-6ZM8 14h.01m2-3h.01'),
    'bouzouki': (lambda _: bouzouki(), 1.10, 'M10.75 11V5H10V2h4v3h-.75v6c2 1 4 3.5 4 6.5a5.25 4.5 0 0 1-10.5 0c0-3 2-5.5 4-6.5ZM12 15h.01m-2 4h4'),
    'guembri': (lambda _: guembri(), 1.13, 'M10.8 12V3q1.2-2 2.4 0v9H16l1 1v8l-1 1H8l-1-1v-8l1-1zM9 18h6m-4-10h-2m4-3h2'),
    'cajon': (lambda _: cajon(), .93, 'M4 6l4-3h12v15l-4 3H4zM4 6h12v15m0-15 4-3M7 9h.01m6 0h.01M7 18h.01m6 0h.01'),
    'saron': (lambda _: saron(), 1.16, 'M4 9h15l2 6H2zM2 15l2 4h15l2-4M7 9l-1 6m5-6v6m4-6 1 6M5 5l3 1 1-2-3-1zM9 5l9-2'),
    'saxophone': (lambda _: saxophone(), 1.02,
                  SAXOPHONE_OUTLINE + SAXOPHONE_SEAM + 'M10.6 8.7h.01m.6 3h.01m.6 3h.01'),
    'auto-tune': (lambda _: auto_tune(), 1.05, 'M2 5h20v14H2zM2 8h20M6 8v11M8.5 15h3m1-3h3m1 2h3'),
    'bassoon': (lambda _: bassoon(), 1.08, 'M20 7h2v4h-2M4 8h16v2H4M4 10l9 1v4H4M4 8H3q-1 0-1 1v5q0 1 1 1h1ZM13 13c2-.1 1.8 2 3.1 2.4s1.7.5 2.6 2'),
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
    'viola': (bowed, 1.19, 'M11 9V4l-1-1V2h4v1l-1 1v5c2-1 4 0 4 2l-1.5 2.5 2 3c1.5 2.5-.5 5.5-5.5 5.5s-7-3-5.5-5.5l2-3L7 11c0-2 2-3 4-2ZM10 17h4M21 5v12.5'),
}


def write(kind, slug, width, height, content):
    assert slug in INSTRUMENTS, f'{slug} is not an instrument in src/data/graph.json'
    target = ROOT / f'instrument-{kind}' / f'{slug}.svg'
    dimensions = ' width="24" height="24"' if kind == 'icons' else ''
    OUTPUT[target] = f'<svg xmlns="{SVG}"{dimensions} viewBox="0 0 {width} {height}">\n{content}\n</svg>\n'


def illustration(kind, slug, width, height, geometry, scale):
    accent, shade = {
        'cornet': ('#fbbf24', '#6c520f'),
        'flugelhorn': ('#fbbf24', '#6c520f'),
        'sousaphone': ('#fbbf24', '#6c520f'),
        'helicon': ('#fbbf24', '#6c520f'),
        'cornetto': ('#fbbf24', '#6c520f'),
        'natural-trumpet': ('#fbbf24', '#6c520f'),
        'trombone': ('#fbbf24', '#6c520f'),
        'trumpet': ('#fbbf24', '#6c520f'),
        'french-horn': ('#fbbf24', '#6c520f'),
        'tuba': ('#fbbf24', '#6c520f'),
        'euphonium': ('#fbbf24', '#6c520f'),
        'yamaha-dx7': ('#38bdf8', '#18516b'),
        'juno-60': ('#38bdf8', '#18516b'),
        'mellotron': ('#38bdf8', '#18516b'),
        'fairlight-cmi': ('#38bdf8', '#18516b'),
        'jupiter-8': ('#38bdf8', '#18516b'),
        'uilleann-pipes': ('#34d399', '#165b42'),
        'celesta': ('#818cf8', '#373c6b'),
        'marimbula': ('#ef4444', '#671d1d'),
        'cuica': ('#ef4444', '#671d1d'),
        'bass-drum': ('#ef4444', '#671d1d'),
        'tamboo-bamboo': ('#ef4444', '#671d1d'),
        'dominican-tambora': ('#ef4444', '#671d1d'),
        'djembe': ('#ef4444', '#671d1d'),
        'ney': ('#34d399', '#165b42'),
        'riqq': ('#ef4444', '#671d1d'),
        'darbuka': ('#ef4444', '#671d1d'),
        'ravann': ('#ef4444', '#671d1d'),
        'maravann': ('#ef4444', '#671d1d'),
        'kayamb': ('#ef4444', '#671d1d'),
        'balafon': ('#ef4444', '#671d1d'),
        'sabar': ('#ef4444', '#671d1d'),
        'tama': ('#ef4444', '#671d1d'),
        'rouler': ('#ef4444', '#671d1d'),
        'didgeridoo': ('#34d399', '#165b42'),
        'taiko': ('#ef4444', '#671d1d'),
        'soribuk': ('#ef4444', '#671d1d'),
        'mridangam': ('#ef4444', '#671d1d'),
        'dhol': ('#ef4444', '#671d1d'),
        'bonang': ('#ef4444', '#671d1d'),
        'dizi': ('#34d399', '#165b42'),
        'suona': ('#34d399', '#165b42'),
        'sheng': ('#34d399', '#165b42'),
        'auto-tune': ('#38bdf8', '#18516b'),
        'bassoon': ('#34d399', '#165b42'),
        'conga': ('#ef4444', '#671d1d'),
        'cajon': ('#ef4444', '#671d1d'),
        'saron': ('#ef4444', '#671d1d'),
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
    'madeiran-machete': 42,
    'bassoon': -58,
    'bouzouki': 38,
    'guembri': 40,
    'cello': 15,
    'double-bass': 15,
    'hichiriki': 78,
    'tanpura': 22,
})


def main(argv):
    check = '--check' in argv
    only = [arg for arg in argv if not arg.startswith('-')]
    unknown = sorted(set(only) - ART.keys())
    if unknown:
        sys.exit(f'Not drawn by this generator: {", ".join(unknown)}')
    selected = {slug: ART[slug] for slug in (only or ART)}
    masters = {slug: (draw(slug), scale, icon) for slug,(draw,scale,icon) in selected.items()}
    for kind, width, height in [('banners',360,160), ('header-backgrounds',360,120), ('avatars',160,160)]:
        for slug, (geometry, scale, _) in masters.items():
            illustration(kind, slug, width, height, geometry, scale)
    for slug, (_, _, icon) in masters.items():
        angle = ICON_ANGLES.get(slug, 0)
        transform = f' transform="rotate({angle} 12 12)"' if angle else ''
        write('icons',slug,24,24,f'<path d="{icon}"{transform} fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>')
    if check:
        drift = [target for target, text in OUTPUT.items()
                 if not target.is_file() or target.read_text() != text]
        for target in drift:
            print(f'DRIFT {target.relative_to(REPO)}')
        print(f'{len(OUTPUT) - len(drift)}/{len(OUTPUT)} generated files match')
        sys.exit(1 if drift else 0)
    for target, text in OUTPUT.items():
        target.write_text(text)
    print(f'Wrote {len(OUTPUT)} files for {len(masters)} instruments')


if __name__ == '__main__':
    main(sys.argv[1:])
