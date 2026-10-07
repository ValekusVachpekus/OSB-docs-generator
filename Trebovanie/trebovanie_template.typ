#set text(font: "Liberation Serif", size: 12pt, lang: "ru")

#set page(
  margin: (top: 2cm, bottom: 2cm, left: 3cm, right: 1.5cm),
  fill: rgb("FBFBFB"), 
  // Вместо pattern используем блок кода с циклом
  background: {
    let grain_tile = tiling(size: (0.4mm, 0.4mm))[
       #place(center, circle(radius: 0.1pt, fill: black.transparentize(83%)))
    ]
    place(center + horizon, rect(width: 100%, height: 100%, fill: grain_tile))

    for i in range(0, 120) {
      // Псевдорандом на основе индекса
      let x = calc.rem(i * 137.5, 210) * 1mm 
      let y = calc.rem(i * 243.1, 297) * 1mm
      let len = calc.rem(i * 7, 5) + 2 // Длина от 2 до 7мм
      let ang = i * 23.5deg
      
      place(top + left, dx: x, dy: y)[
        #rotate(ang)[
          #line(length: len * 1mm, stroke: 0.15pt + gray.transparentize(75%))
        ]
      ]
    }
    // Настраиваем прозрачность и размер здесь
    let watermark_text = rotate(-45deg, text(size: 140pt, fill: rgb(1, 1, 1, 3%))[])
    
    // Цикл расставляет надписи по сетке (6 колонок, 8 рядов)
    for x in range(0, 6) {
      for y in range(0, 8) {
        // Шаг сетки — 8 см по горизонтали и 10 см по вертикали
        place(top + left, dx: -5cm + x * 8cm, dy: -2cm + y * 10cm)[#watermark_text]
      }
    }

    for i in range(0, 14) {
      let sx = calc.rem(i * 41.7, 210) * 1mm
      let sy = calc.rem(i * 89.3, 297) * 1mm
      let rad = (calc.rem(i * 17, 18) + 6) * 0.12mm
      place(top + left, dx: sx, dy: sy)[
        #circle(radius: rad, fill: black.transparentize(97%))
      ]
    }

    place(top + left, dx: 102mm, dy: 0mm)[
      #rect(width: 0.35mm, height: 297mm, fill: black.transparentize(98%))
    ]

    rect(width: 100%, height: 100%, fill: gradient.radial(rgb(0,0,0,0%), rgb(0,0,0,5%), center: (50%, 50%), radius: 80%))
  }
)

#set par(justify: true, first-line-indent: 1.25cm, leading: 0.65em)


// --- Шапка документа ---
#align(center)[
  #block(width: 1.5cm)[#image("gerb.svg")] 
  #v(0.2em)
  #set text(size: 10pt)
  #upper[Министерство внутренних дел Российской Федерации] \
  #set text(size: 11pt, weight: "bold")
  ОТДЕЛ СОБСТВЕННОЙ БЕЗОПАСНОСТИ \ ГЛАВНОГО УПРАВЛЕНИЯ МВД ПО НИЖЕГОРОДСКОЙ ОБЛАСТИ
  
  #v(1em)
  #text(size: 18pt, weight: "bold", tracking: 0.4em)[ТРЕБОВАНИЕ]
]

#v(0.5em)

// --- Линия даты и номера ---
#grid(
  columns: (1fr, 1fr, 1fr),
  align: (left, center, right),
  [« 13 » апреля 2026 г.],
  [],
  [г. Арзамас]
)

#v(1.5em)

// --- Блок заголовка и штампа ---
#grid(
  columns: (1.2fr, 1fr),
  gutter: 1cm,
  // Левая колонка: Заголовок
  align(left + top)[
    #set par(first-line-indent: 0pt, justify: false)
    #set text(size: 11pt)
    Об устранении признаков административного правонарушения, предусмотренного ст. 13.6 КоАП РФ
  ],
  // Правая колонка: Штамп заверения
  rotate(-1.5deg)[
    #move(dx: 5pt, dy: -10pt)[
      #rect(
        width: 100%,
        inset: 6pt,
        stroke: 0.7pt + blue.darken(20%),
        fill: white.transparentize(40%), 
        [
          #set align(left)
          #set text(size: 7.5pt, fill: blue.darken(30%))
          #align(center)[#text(size: 10pt, weight: "bold")[КОПИЯ ВЕРНА]]
          #v(4pt)
          Заместитель начальника отдела собственной безопасности ГУ МВД, майор полиции Щетков Владислав Алексеевич
          
          #v(8pt)
          #grid(
            columns: (1fr, 1.2fr),
            align(bottom)[«_13_» _04_ 2026 г.],
            align(bottom + right)[
              #stack(
                dir: ltr,
                spacing: 2pt,
                block(width: 1.4cm)[#image("canvas1.png")],
                [ B.A. Щетков]
              )
            ]
          )
        ]
      )
    ]
  ]
)

#v(1.5em)

// --- Преамбула ---
В целях обеспечения соблюдения законности сотрудниками органов внутренних дел, а также пресечения нарушения ст. 13.6 КоАП РФ со стороны инспектора отдельного батальона ДПС Ивана Иванова —

#v(1em)
#align(center)[#text(weight: "bold")[Т Р Е Б У Ю:]]
#v(0.5em)

// --- Пункты требования ---
#set enum(indent: 1.25cm)
+ В срок до 14 апреля 2026 года устранить признаки административного правонарушения, предусмотренного ст. 13.6 КоАП РФ.
+ Демонтировать с лобового и передних боковых стекол автомобиля BMW M4 G83 (ГРЗ С003ХА 06) покрытие, светопропускание которого не соответствует требованиям действующего законодательства.
+ Разъяснить, что невыполнение настоящего требования в установленный срок влечет ответственность по ст. 20.6 КоАП РФ.

#v(2em)

// --- Подписи ---
#grid(
  columns: (1.5fr, 1fr),
  [Заместитель начальника ОСБ ГУ МВД \ майор полиции],
  align(bottom + right)[
    #rotate(-0.7deg)[
      #move(dx: 1.2pt, dy: -1pt)[
        #stack(
          dir: ltr,
          spacing: 5pt,
          block(width: 2.5cm)[#image("canvas1.png")],
          [ B.A. Щетков]
        )
      ]
    ]
  ]
)

#v(1cm)
#line(length: 100%, stroke: 0.5pt + gray)
#v(0.5cm)

#grid(
  columns: (1.5fr, 1fr),
  [Инспектор ОБ ДПС Юрий Ингушев  \ С требованием ознакомлен],
  align(bottom + right)[
    #stack(
      dir: ltr,
      spacing: 5pt,
      [Ингушев /],
      [ Ю.С. Ингушев]
    )
  ]
)

#place(top + left, dx: 1mm, dy: 245mm)[
  #rotate(-1.3deg)[
    #rect(
      width: 50mm,
      inset: 6pt,
      stroke: 0.6pt + red.darken(15%).transparentize(35%),
      fill: white.transparentize(75%),
      [
        #set text(size: 8.5pt, fill: red.darken(15%).transparentize(12%))
        #set par(first-line-indent: 0pt, justify: false)
        #align(center)[#text(weight: "bold")[СОГЛАСОВАНО]]
        #v(2pt)
        Начальник ОСБ ГУ МВД \
        подполковник полиции \
        «12» апреля 2026 г. \
        Подпись: Леонов \
        ФИО: Леонов Данила Сергеевич
      ]
    )
  ]
]

#place(top + left, dx: 56mm, dy: 246mm)[
  #rotate(-0.3deg)[
    #rect(
      width: 50mm,
      inset: 6pt,
      stroke: 0.6pt + red.darken(15%).transparentize(35%),
      fill: white.transparentize(75%),
      [
        #set text(size: 8.5pt, fill: red.darken(15%).transparentize(12%))
        #set par(first-line-indent: 0pt, justify: false)
        #align(center)[#text(weight: "bold")[СОГЛАСОВАНО]]
        #v(2pt)
        Начальник ГУ МВД \
        генерал-лейтенант полиции \
        «12» апреля 2026 г. \
        Подпись: Егоров \
        ФИО: Егоров Дионис Иванович
      ]
    )
  ]
]

#place(top + left, dx: 107mm, dy: 249mm)[
  #rotate(2.1deg)[
    #rect(
      width: 52mm,
      inset: 6pt,
      stroke: 0.6pt + red.darken(10%).transparentize(30%),
      fill: white.transparentize(58%),
      [
        #set text(size: 8.5pt, fill: red.darken(10%).transparentize(10%))
        #set par(first-line-indent: 0pt, justify: false)
        #align(center)[#text(weight: "bold")[ОТМЕТКА О ВРУЧЕНИИ]]
        #v(2pt)
        Дата: « 12 » апреля 2026 г. \
        Время: 00:00 \
        Подпись получившего: ПОДПИСЬ \
        ФИО: Иванов Иван Иванович
      ]
    )
  ]
]

// --- Исполнитель ---
#v(1fr)
#set text(size: 8pt)
#block(inset: (left: -1.25cm))[
  Исполнитель: Щетков В.А. \
  Тел: 5-6-5
]
