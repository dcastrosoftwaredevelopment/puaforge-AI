import { createTheme } from 'flowbite-react'

export const flowbiteTheme = createTheme({
  button: {
    base: 'group flex items-center justify-center text-center font-medium rounded-lg relative focus:z-10 focus:outline-none transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
    color: {
      primary: 'bg-forge-terracotta text-white hover:bg-forge-terracotta/90 border border-transparent',
      secondary: 'bg-bg-elevated text-text-secondary border border-border-subtle hover:text-text-primary hover:bg-bg-tertiary',
      blue: 'bg-vibe-blue/10 text-vibe-blue border border-vibe-blue/20 hover:bg-vibe-blue/15',
      ghost: 'bg-transparent text-text-secondary border border-transparent hover:text-text-primary hover:bg-bg-elevated',
      danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
    },
    size: {
      xs: 'px-2 py-1 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
      xl: 'px-6 py-3 text-base',
    },
    pill: 'rounded-full',
    disabled: 'opacity-50 cursor-not-allowed',
    fullSized: 'w-full',
    grouped: 'rounded-none first:rounded-l-lg last:rounded-r-lg',
    outlineColor: {},
  },
  modal: {
    root: {
      base: 'fixed inset-0 z-50 flex items-center justify-center px-4',
      show: {
        on: 'flex',
        off: 'hidden',
      },
      sizes: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
      },
      positions: {
        'top-left': 'justify-start items-start',
        'top-center': 'justify-center items-start',
        'top-right': 'justify-end items-start',
        'center-left': 'justify-start items-center',
        center: 'justify-center items-center',
        'center-right': 'justify-end items-center',
        'bottom-right': 'justify-end items-end',
        'bottom-center': 'justify-center items-end',
        'bottom-left': 'justify-start items-end',
      },
    },
    content: {
      base: 'relative w-full',
      inner: 'relative flex max-h-[90dvh] flex-col rounded-2xl bg-bg-secondary border border-border-subtle shadow-2xl',
    },
    body: {
      base: 'flex-1 overflow-auto p-5',
      popup: 'pt-0',
    },
    header: {
      base: 'flex items-center justify-between rounded-t-2xl p-5 border-b border-border-subtle',
      popup: 'border-b-0 p-4',
      title: 'text-base font-semibold text-text-primary',
      close: {
        base: 'ml-auto inline-flex items-center rounded-lg p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-elevated transition',
        icon: 'h-4 w-4',
      },
    },
    footer: {
      base: 'flex items-center space-x-2 rounded-b-2xl border-t border-border-subtle p-4',
      popup: 'border-t-0',
    },
  },
  textInput: {
    base: 'flex',
    addon: 'inline-flex items-center rounded-l-lg border border-r-0 border-border-subtle bg-bg-elevated px-3 text-sm text-text-muted',
    field: {
      base: 'relative w-full',
      icon: {
        base: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3',
        svg: 'h-4 w-4 text-text-muted',
      },
      rightIcon: {
        base: 'pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3',
        svg: 'h-4 w-4 text-text-muted',
      },
      input: {
        base: 'block w-full rounded-lg border bg-bg-primary text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition',
        sizes: {
          sm: 'px-3 py-2 text-xs',
          md: 'px-3 py-2 text-sm',
          lg: 'px-4 py-3 text-base',
        },
        colors: {
          gray: 'border-border-subtle focus:border-forge-terracotta',
          info: 'border-vibe-blue/50 focus:border-vibe-blue',
          failure: 'border-red-500 focus:border-red-400',
          warning: 'border-yellow-500 focus:border-yellow-400',
          success: 'border-green-500 focus:border-green-400',
        },
        withIcon: { on: 'pl-10', off: '' },
        withRightIcon: { on: 'pr-10', off: '' },
        withAddon: { on: 'rounded-r-lg rounded-l-none', off: 'rounded-lg' },
        withShadow: { on: '', off: '' },
      },
    },
  },
  tooltip: {
    target: 'w-fit',
    animation: 'transition-opacity',
    arrow: {
      base: 'absolute z-10 h-2 w-2 rotate-45',
      placement: '-4px',
      style: {
        dark: 'bg-bg-elevated',
        light: 'bg-white',
        auto: 'bg-bg-elevated',
      },
    },
    base: 'absolute z-10 inline-block rounded-lg px-3 py-2 text-xs font-medium shadow-md',
    content: 'relative z-20',
    hidden: 'invisible opacity-0',
    style: {
      dark: 'bg-bg-elevated text-text-primary border border-border-subtle',
      light: 'bg-white text-gray-900',
      auto: 'bg-bg-elevated text-text-primary border border-border-subtle',
    },
  },
  progress: {
    base: 'w-full overflow-hidden rounded-full bg-bg-elevated',
    label: 'mb-1 flex justify-between font-medium text-xs text-text-muted',
    bar: 'rounded-full text-center text-xs font-medium leading-none text-white',
    color: {
      primary: 'bg-forge-terracotta',
      blue: 'bg-vibe-blue',
      gray: 'bg-bg-elevated',
    },
    size: {
      xs: 'h-0.5',
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-4',
      xl: 'h-6',
    },
  },
  card: {
    root: {
      base: 'flex rounded-xl border border-border-subtle bg-bg-secondary shadow-sm',
      children: 'flex h-full flex-col justify-center gap-4 p-5',
      horizontal: {
        off: 'flex-col',
        on: 'flex-col md:flex-row',
      },
      href: 'hover:border-border-default transition-colors cursor-pointer',
    },
    img: {
      base: '',
      horizontal: {
        off: 'rounded-t-xl',
        on: 'h-96 w-full rounded-t-xl object-cover md:h-auto md:w-48 md:rounded-none md:rounded-l-xl',
      },
    },
  },
  drawer: {
    root: {
      base: 'fixed z-40 overflow-y-auto bg-bg-secondary border-border-subtle transition-transform',
      backdrop: 'fixed inset-0 z-30 bg-black/50',
      edge: 'bottom-16',
      position: {
        top: { on: 'left-0 right-0 top-0 w-full translate-y-0 border-b', off: 'left-0 right-0 top-0 w-full -translate-y-full border-b' },
        right: { on: 'right-0 top-0 h-screen w-80 translate-x-0 border-l', off: 'right-0 top-0 h-screen w-80 translate-x-full border-l' },
        bottom: { on: 'bottom-0 left-0 right-0 w-full translate-y-0 border-t', off: 'bottom-0 left-0 right-0 w-full translate-y-full border-t' },
        left: { on: 'left-0 top-0 h-screen w-80 translate-x-0 border-r', off: 'left-0 top-0 h-screen w-80 -translate-x-full border-r' },
      },
    },
    header: {
      inner: {
        closeButton: 'absolute end-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition',
        closeIcon: 'h-4 w-4',
        titleIcon: 'me-2.5 h-4 w-4',
        titleText: 'mb-4 inline-flex items-center text-base font-semibold text-text-primary',
      },
      collapsed: {
        on: 'hidden',
        off: 'block',
      },
    },
    items: {
      base: '',
    },
  },
  dropdown: {
    floating: {
      animation: 'transition-opacity',
      arrow: {
        base: 'absolute z-10 h-2 w-2 rotate-45',
        placement: '-4px',
        style: {
          dark: 'bg-bg-elevated',
          light: 'bg-white',
          auto: 'bg-bg-elevated',
        },
      },
      base: 'z-10 w-fit divide-y divide-border-subtle rounded-xl shadow-lg focus:outline-none',
      content: 'rounded-xl text-sm',
      divider: 'my-1 h-px bg-border-subtle',
      header: 'block px-4 py-2 text-sm text-text-muted',
      hidden: 'invisible opacity-0',
      item: {
        container: '',
        base: 'flex w-full cursor-pointer items-center justify-start px-4 py-2 text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary focus:bg-bg-elevated focus:outline-none transition',
        icon: 'mr-2 h-4 w-4',
      },
      style: {
        auto: 'bg-bg-secondary border border-border-subtle text-text-primary',
        dark: 'bg-bg-elevated text-text-primary',
        light: 'border border-gray-200 bg-white text-gray-900',
      },
      target: 'w-fit',
    },
    content: 'py-1 focus:outline-none',
    inlineWrapper: 'flex items-center',
    arrowIcon: 'ml-2 h-4 w-4',
  },
})
