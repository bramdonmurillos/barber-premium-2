import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

/**
 * Reusable modal component with premium styling
 * Uses Headless UI for accessibility and animations
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal closes
 * @param {string} title - Modal title text
 * @param {React.ReactNode} children - Modal content
 */
export default function Modal({ isOpen, onClose, title, children }) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
        </Transition.Child>

        {/* Modal panel container — outer div scrolls so tall modals are reachable */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-2xl my-8 flex flex-col max-h-[90vh]">
              {/* Modal header — sticky so it stays visible while scrolling */}
              <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                <Dialog.Title className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {title}
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal content — scrollable */}
              <div className="overflow-y-auto flex-1 p-4 lg:p-6 text-gray-600 dark:text-gray-300">
                {children}
              </div>
            </Dialog.Panel>
          </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
