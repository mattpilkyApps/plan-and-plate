import BottomSheet from './ui/BottomSheet'

function ComingSoonSheet({ message, onClose, title = 'Coming soon' }) {
  if (!message) {
    return null
  }

  return (
    <BottomSheet eyebrow="Not available yet" onClose={onClose} title={title}>
        <p className="mt-4 rounded-2xl bg-[#F8F2EA] px-4 py-3 text-sm font-semibold leading-relaxed text-stone-500">
          {message}
        </p>
    </BottomSheet>
  )
}

export default ComingSoonSheet
